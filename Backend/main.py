from fastapi import FastAPI, Request, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore

load_dotenv()

app = FastAPI(title="ELEVEN CHAT - Revenue Intelligence AI Gateway")

# Segurança: O segredo que você vai colocar no cabeçalho customizado na ElevenLabs
# Nome do Cabeçalho: X-Secret-Key
# Valor: eleven_chat_master_secret
SECRET_KEY = "eleven_chat_master_secret"

# Inicialização Firebase (Opcional por enquanto para não travar o teste)
db = None
try:
    if os.path.exists("firebase-key.json"):
        cred = credentials.Certificate("firebase-key.json")
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("Firebase conectado com sucesso!")
    else:
        print("Aviso: firebase-key.json não encontrado. Rodando em modo de teste sem DB.")
except Exception as e:
    print(f"Erro ao conectar Firebase: {e}")

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
    return {"status": "online", "name": "ELEVEN CHAT", "mcp_enabled": True}

@app.post("/api/v1/webhooks/elevenlabs")
async def handle_elevenlabs_webhook(payload: WebhookPayload):
    data = payload.analysis.data_collection
    insight = {
        "conversation_id": payload.conversation_id,
        "agent_id": payload.agent_id,
        "customer_name": data.get("customer_name"),
        "location": data.get("location"),
        "price_objection": data.get("price_objection", False),
        "summary": payload.analysis.summary,
        "timestamp": firestore.SERVER_TIMESTAMP if db else None
    }
    
    print(f"WEBHOOK RECEBIDO: {insight}")
    
    if db:
        db.collection("interactions").add(insight)
        return {"status": "success", "message": "Insight salvo no Firebase"}
    return {"status": "success", "message": "Recebido (Simulação: Sem Firebase)"}

# ENDPOINT MCP (PROTOCOL)
@app.post("/api/v1/mcp")
async def mcp_handler(request: Request, x_secret_key: Optional[str] = Header(None)):
    """
    Protocolo MCP da ElevenLabs.
    Lida com handshake e execução de ferramentas.
    """
    # Validação de segurança simples
    if x_secret_key != SECRET_KEY:
        print(f"Aviso: Tentativa de acesso sem chave correta. Recebeu: {x_secret_key}")
        # Por enquanto vamos deixar passar no teste se você esquecer o header, 
        # mas no SaaS real isso é obrigatório.
        pass

    print(f"--- MCP HANDSHAKE DETECTADO ---")
    try:
        body = await request.json()
        print(f"PAYLOAD DA ELEVENLABS: {body}")
        
        # Resposta simplificada para handshake
        response = {
            "tools": [
                {
                    "name": "check_stock_and_prices",
                    "description": "Consulta o sistema da Eleven Chat para ver preços e disponibilidade de produtos.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "product_name": {"type": "string", "description": "Nome do produto para consultar"}
                        },
                        "required": ["product_name"]
                    }
                }
            ]
        }
        print(f"ENVIANDO FERRAMENTAS: {[t['name'] for t in response['tools']]}")
        return response
    except Exception as e:
        print(f"Erro no MCP: {e}")
        return {"tools": []}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
