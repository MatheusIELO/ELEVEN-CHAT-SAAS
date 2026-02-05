import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        const saVar = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (saVar) {
            const serviceAccount = JSON.parse(saVar);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log('✅ Firebase Admin Inicializado');
        } else {
            console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT não configurada');
        }
    } catch (error) {
        console.error('❌ Erro na inicialização do Firebase Admin:', error);
    }
}

export const db = admin.apps.length
    ? admin.firestore()
    : null as unknown as admin.firestore.Firestore;
