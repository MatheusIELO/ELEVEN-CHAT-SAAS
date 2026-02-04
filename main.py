from fastapi import FastAPI, Request, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import json
import httpx
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore

load_dotenv()

app = FastAPI(title="ELEVEN CHAT - Revenue Intelligence AI Gateway")

# Configuração de CORS para permitir que o Frontend (Next.js) acesse o Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Em produção, coloque o seu domínio da Vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Segurança e Chaves
WEBHOOK_SECRET = os.getenv("ELEVEN_WEBHOOK_SECRET", "wsec_ca7176bd640a051c8a6b8f123d0dd17986f338ae9c61ffb49d4647d97304bc51")
ELEVENLABS_API_KEY = os.getenv("ELEVEN_API_KEY")

# Inicialização Firebase
db = None
try:
    # 1. Tenta carregar de variável de ambiente (Produção)
    firebase_json = os.getenv("FIREBASE_CREDENTIALS")
    if firebase_json:
        cred_dict = json.loads(firebase_json)
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("✅ FIREBASE CONECTADO (AMBIENTE)!")
    # 2. Tenta carregar de arquivo local (Desenvolvimento)
    else:
        cred_path = os.path.join(os.getcwd(), "firebase-key.json")
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            db = firestore.client()
            print("✅ FIREBASE CONECTADO (ARQUIVO)!")
        else:
            print("❌ ERRO: Nenhuma credencial Firebase encontrada.")
except Exception as e:
    print(f"❌ Erro crítico ao conectar Firebase: {e}")

# Modelos
class EntityConfig(BaseModel):
    name: str
    description: str

class AgentSetup(BaseModel):
    agent_id: str
    area: str
    bot_name: str
    prompt: str
    entities: List[EntityConfig]

class ElevenLabsAnalysis(BaseModel):
    data_collection: Dict[str, Any]
    summary: str
    sentiment: Optional[str] = None

class WebhookPayload(BaseModel):
    conversation_id: str
    agent_id: str
    analysis: ElevenLabsAnalysis
    transcript: Optional[str] = None

@app.get("/")
async def root():
    return {
        "status": "online", 
        "firebase_connected": db is not None,
        "elevenlabs_configured": bool(ELEVENLABS_API_KEY)
    }

@app.post("/api/v1/agent/setup")
async def setup_agent(setup: AgentSetup, user_id: str = Header(None)):
    """
    Recebe as configurações do Frontend e atualiza a ElevenLabs.
    """
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID não informado")
        
    if not ELEVENLABS_API_KEY:
        raise HTTPException(status_code=500, detail="ElevenLabs API Key não configurada")

    # 1. Salva no Firebase segmentado por usuário
    if db:
        user_ref = db.collection("users").document(user_id)
        user_ref.collection("settings").document("current_agent").set(setup.dict())

    # 2. Atualiza a ElevenLabs
    url = f"https://api.elevenlabs.io/v1/convai/agents/{setup.agent_id}"
    headers = {"xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json"}
    
    payload = {
        "conversation_config": {
            "agent": {
                "prompt": {
                    "prompt": f"Seu nome é {setup.bot_name}. Você atua na área de {setup.area}. {setup.prompt}"
                }
            }
        }
    }
    
    data_collection = {}
    for entity in setup.entities:
        data_collection[entity.name] = {"type": "string", "description": entity.description}
    
    payload["analysis_config"] = {"data_collection": data_collection}

    async with httpx.AsyncClient() as client:
        response = await client.patch(url, json=payload, headers=headers)
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=f"Erro ElevenLabs: {response.text}")
            
    return {"status": "success", "message": "Robô atualizado e salvo na sua conta!"}

@app.post("/api/v1/webhooks/elevenlabs")
async def handle_elevenlabs_webhook(
    payload: WebhookPayload, 
    request: Request,
    elevenlabs_signature: Optional[str] = Header(None, alias="ElevenLabs-Signature")
):
    """
    IMPORTANTE: No Webhook, a ElevenLabs não envia o nosso UserID diretamente.
    Precisamos descobrir de quem é esse agent_id.
    """
    agent_id = payload.agent_id
    
    # Busca qual usuário é dono deste agent_id no Firestore
    user_owner = None
    if db:
        # Busca em todos os usuários quem tem este agent_id configurado
        # Em larga escala, o ideal seria ter uma tabela de indexação AgentID -> UserID
        users = db.collection_group("settings").where("agent_id", "==", agent_id).limit(1).get()
        if users:
            # Pega o ID do documento pai (o usuário)
            user_owner = users[0].reference.parent.parent.id

    data = payload.analysis.data_collection
    insight = {
        "conversation_id": payload.conversation_id,
        "agent_id": payload.agent_id,
        "summary": payload.analysis.summary,
        "sentiment": payload.analysis.sentiment,
        "extracted_data": data,
        "timestamp": firestore.SERVER_TIMESTAMP if db else None
    }
    
    if db and user_owner:
        user_ref = db.collection("users").document(user_owner)
        user_ref.collection("interactions").document(payload.conversation_id).set(insight)
        
        if any(key in data for key in ["customer_name", "nome", "nome_cliente"]):
            user_ref.collection("leads").add({**insight, "type": "detected_lead"})
            
        return {"status": "success", "message": f"Dados salvos para o usuário {user_owner}"}
            
    return {"status": "success"}

@app.get("/api/v1/stats")
async def get_stats(user_id: str = Header(None)):
    if not user_id or not db:
        return {"total_conversations": 0, "total_leads": 0}
    
    user_ref = db.collection("users").document(user_id)
    interactions = user_ref.collection("interactions").get()
    leads = user_ref.collection("leads").get()
    
    return {
        "total_conversations": len(interactions),
        "total_leads": len(leads),
        "conversion_rate": f"{(len(leads)/len(interactions)*100):.1f}%" if len(interactions) > 0 else "0%"
    }

@app.get("/api/v1/interactions")
async def get_interactions(user_id: str = Header(None), limit: int = 10):
    if not user_id or not db:
        return []
    
    user_ref = db.collection("users").document(user_id)
    docs = user_ref.collection("interactions").order_by("timestamp", direction=firestore.Query.DESCENDING).limit(limit).get()
    
    results = []
    for doc in docs:
        d = doc.to_dict()
        if "timestamp" in d and d["timestamp"]:
            d["timestamp"] = d["timestamp"].isoformat()
        results.append(d)
    return results

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
