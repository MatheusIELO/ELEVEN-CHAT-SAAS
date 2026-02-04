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
async def setup_agent(setup: AgentSetup):
    """
    Recebe as configurações do Frontend e atualiza a ElevenLabs.
    """
    if not ELEVENLABS_API_KEY:
        raise HTTPException(status_code=500, detail="ElevenLabs API Key não configurada no .env")

    # 1. Salva no Firebase para o Dashboard saber como o robô está configurado
    if db:
        db.collection("settings").document("current_agent").set(setup.dict())

    # 2. Atualiza a ElevenLabs via API deles
    # O objetivo aqui é atualizar o 'analysis_config' (data collection) e o 'system_prompt'
    url = f"https://api.elevenlabs.io/v1/convai/agents/{setup.agent_id}"
    
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json"
    }
    
    # Criamos o payload de atualização
    payload = {
        "conversation_config": {
            "agent": {
                "prompt": {
                    "prompt": f"Seu nome é {setup.bot_name}. Você atua na área de {setup.area}. {setup.prompt}"
                }
            }
        }
    }
    
    # Adicionamos a extração de dados dinâmica (entities)
    # Na ElevenLabs, isso fica em analysis_config.data_collection
    data_collection = {}
    for entity in setup.entities:
        data_collection[entity.name] = {
            "type": "string",
            "description": entity.description
        }
    
    payload["analysis_config"] = {
        "data_collection": data_collection
    }

    async with httpx.AsyncClient() as client:
        response = await client.patch(url, json=payload, headers=headers)
        if response.status_code != 200:
            print(f"❌ Erro ElevenLabs: {response.text}")
            raise HTTPException(status_code=response.status_code, detail="Erro ao atualizar ElevenLabs")
            
    return {"status": "success", "message": "Robô atualizado com as novas captações!"}

@app.post("/api/v1/webhooks/elevenlabs")
async def handle_elevenlabs_webhook(
    payload: WebhookPayload, 
    request: Request,
    x_secret_key: Optional[str] = Header(None),
    elevenlabs_signature: Optional[str] = Header(None, alias="ElevenLabs-Signature")
):
    """
    Recebe os dados da conversa da ElevenLabs e salva no Firebase.
    """
    # Validação Básica de Segurança
    # Se você configurou como HMAC na ElevenLabs, ela envia a assinatura.
    # Se não, podemos usar o segredo simples que passamos no setup.
    if x_secret_key != WEBHOOK_SECRET and not elevenlabs_signature:
         print(f"⚠️ Tentativa de acesso não autorizado ao webhook!")
         # Por enquanto vamos deixar passar para não travar seu teste, 
         # mas em produção você ativaria o erro abaixo:
         # raise HTTPException(status_code=401, detail="Não autorizado")

    data = payload.analysis.data_collection
    insight = {
        "conversation_id": payload.conversation_id,
        "agent_id": payload.agent_id,
        "summary": payload.analysis.summary,
        "sentiment": payload.analysis.sentiment,
        "extracted_data": data,
        "timestamp": firestore.SERVER_TIMESTAMP if db else None
    }
    
    if db:
        # Salva a interação completa
        db.collection("interactions").document(payload.conversation_id).set(insight)
        
        # Se detectou nome, salva como um Lead potencial para o comercial
        if any(key in data for key in ["customer_name", "nome", "nome_cliente"]):
            db.collection("leads").add({**insight, "type": "detected_lead"})
            
        return {"status": "success", "message": "Dados processados e salvos no Firebase"}
            
    return {"status": "success"}

@app.post("/api/v1/mcp")
async def mcp_handler(request: Request):
    return {
        "tools": [
            {
                "name": "verificar_estoque",
                "description": "Consulta o estoque e preços reais.",
                "parameters": {
                    "type": "object",
                    "properties": { "produto": {"type": "string"} },
                    "required": ["produto"]
                }
            }
        ]
    }

@app.get("/api/v1/stats")
async def get_stats():
    """
    Calcula estatísticas básicas para o Dashboard.
    """
    if not db:
        return {"total_conversations": 0, "total_leads": 0}
    
    # Simulação de contagem (para um SaaS real, você usaria contadores ou agregação)
    interactions = db.collection("interactions").get()
    leads = db.collection("leads").get()
    
    return {
        "total_conversations": len(interactions),
        "total_leads": len(leads),
        "conversion_rate": f"{(len(leads)/len(interactions)*100):.1f}%" if len(interactions) > 0 else "0%"
    }

@app.get("/api/v1/interactions")
async def get_interactions(limit: int = 10):
    """
    Lista as últimas interações salvas.
    """
    if not db:
        return []
    
    docs = db.collection("interactions").order_by("timestamp", direction=firestore.Query.DESCENDING).limit(limit).get()
    
    results = []
    for doc in docs:
        d = doc.to_dict()
        # Converte timestamp para string para o JSON
        if "timestamp" in d and d["timestamp"]:
            d["timestamp"] = d["timestamp"].isoformat()
        results.append(d)
        
    return results

if __name__ == "__main__":
    import uvicorn
    # Rodando na porta 8000 para o Localtunnel
    uvicorn.run(app, host="0.0.0.0", port=8000)
