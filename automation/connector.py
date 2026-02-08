import os
import asyncio
import time
from dotenv import load_dotenv
from browser_use import Agent, Browser, BrowserConfig
from langchain_openai import ChatOpenAI
import firebase_admin
from firebase_admin import credentials, firestore

load_dotenv()

# Configuração do Browser
browser = Browser(
    config=BrowserConfig(
        headless=True,  # Necessário para rodar no servidor
        disable_security=True # Ajuda a lidar com popups e iframe da Meta
    )
)

# Inicializa Firebase se não estiver inicializado
if not firebase_admin._apps:
    cred = credentials.Certificate(os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH"))
    firebase_admin.initialize_app(cred)

db = firestore.client()

class WhatsAppAutomation:
    def __init__(self, agent_id, user_email, user_password):
        self.agent_id = agent_id
        self.user_email = user_email
        self.user_password = user_password
        self.llm = ChatOpenAI(model="gpt-4o")

    async def wait_for_otp(self, automation_id):
        """Polls Firestore for OTP code submitted by the user"""
        print(f"Aguardando OTP para automação: {automation_id}")
        start_time = time.time()
        timeout = 180  # 3 minutos
        
        while time.time() - start_time < timeout:
            doc_ref = db.collection('automations').doc(automation_id)
            doc = doc_ref.get()
            if doc.exists:
                data = doc.to_dict()
                if 'otp_code' in data:
                    return data['otp_code']
            await asyncio.sleep(5)
        
        return None

    async def run(self, client_phone):
        automation_id = f"wa_{self.agent_id}_{int(time.time())}"
        
        # Registra o início da automação no Firestore
        db.collection('automations').doc(automation_id).set({
            'status': 'running',
            'agent_id': self.agent_id,
            'client_phone': client_phone,
            'step': 'login',
            'timestamp': firestore.SERVER_TIMESTAMP
        })

        task = f"""
        1. Vá para https://elevenlabs.io/app/sign-in
        2. Faça login com o email "{self.user_email}" e a senha "{self.user_password}". 
           Se houver um botão de "Sign in with Google", ignore e use o campo de email/senha se disponível, 
           caso contrário, procure o formulário de login padrão.
        3. Após logar, navegue até a aba 'Conversational AI' ou 'Agents'.
        4. Encontre o agente com ID "{self.agent_id}" ou com o nome correspondente e clique nele.
        5. Vá na aba de 'Integrations' ou 'Widgets/Conectores'.
        6. Clique em 'WhatsApp'.
        7. Clique no botão para adicionar um novo número ou configurar WABA.
        8. Quando o popup da Meta aparecer (Embedded Signup), clique em 'Continuar' ou 'Get Started' 
           usando a conta selecionada (que já deve estar logada).
        9. Avance até a tela de inserir o número de telefone.
        10. Insira o número "{client_phone}".
        11. Pare na tela que pede o código de verificação (SMS/OTP) e ME AVISE que chegou nessa etapa.
        """

        agent = Agent(
            task=task,
            llm=self.llm,
            browser=browser
        )

        try:
            # Executa até o ponto do OTP
            result = await agent.run()
            
            # Atualiza status e pede OTP
            db.collection('automations').doc(automation_id).update({
                'step': 'awaiting_otp',
                'status': 'waiting'
            })

            otp = await self.wait_for_otp(automation_id)
            
            if not otp:
                db.collection('automations').doc(automation_id).update({
                    'status': 'failed',
                    'error': 'Timeout aguardando OTP'
                })
                return "Erro: Timeout aguardando OTP"

            # Retoma a automação com o código OTP
            resume_task = f"Insira o código de verificação {otp} na tela atual e finalize a configuração."
            resume_agent = Agent(task=resume_task, llm=self.llm, browser=agent.browser) # Reuse current browser state
            
            final_result = await resume_agent.run()
            
            db.collection('automations').doc(automation_id).update({
                'status': 'success',
                'step': 'completed'
            })
            
            return final_result

        except Exception as e:
            db.collection('automations').doc(automation_id).update({
                'status': 'failed',
                'error': str(e)
            })
            raise e

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 5:
        print("Usage: python connector.py <agent_id> <email> <password> <client_phone>")
        sys.exit(1)
    
    a_id, email, pwd, phone = sys.argv[1:5]
    bot = WhatsAppAutomation(a_id, email, pwd)
    asyncio.run(bot.run(phone))
