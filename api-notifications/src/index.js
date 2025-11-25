const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Inicializar Firebase Admin SDK
// Usa o projectId do projeto: elevi-tcc
const PROJECT_ID = 'elevi-tcc';

if (!admin.apps.length) {
  try {
    // Opção 1: Se tiver arquivo de credenciais JSON na pasta api-notifications
    const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: PROJECT_ID
      });
      console.log('✅ Firebase Admin SDK inicializado com arquivo serviceAccountKey.json');
    }
    // Opção 2: Se tiver arquivo de credenciais JSON completo em variável de ambiente
    else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: PROJECT_ID
      });
      console.log('✅ Firebase Admin SDK inicializado com FIREBASE_SERVICE_ACCOUNT');
    } 
    // Opção 3: Se tiver variáveis de ambiente individuais
    else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID || PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        })
      });
      console.log('✅ Firebase Admin SDK inicializado com variáveis individuais');
    }
    // Opção 3: Tentar usar Application Default Credentials (ADC)
    // Funciona se você estiver rodando no Google Cloud ou tiver gcloud configurado
    else {
      try {
        admin.initializeApp({
          projectId: PROJECT_ID
        });
        console.log(`✅ Firebase Admin SDK inicializado com Application Default Credentials (projectId: ${PROJECT_ID})`);
      } catch (adcError) {
        // Se ADC não funcionar, inicializa apenas com projectId
        // Isso permite que a API rode, mas não poderá enviar notificações sem credenciais
        admin.initializeApp({
          projectId: PROJECT_ID
        });
        console.log(`⚠️  Firebase Admin SDK inicializado apenas com projectId (${PROJECT_ID}).`);
        console.log('⚠️  Para enviar notificações FCM, você precisa configurar as credenciais de Service Account.');
        console.log('\n📋 Como configurar:');
        console.log('   1. Acesse: https://console.firebase.google.com/project/elevi-tcc/settings/serviceaccounts/adminsdk');
        console.log('   2. Clique em "Gerar nova chave privada"');
        console.log('   3. Baixe o arquivo JSON');
        console.log('   4. Crie um arquivo .env na pasta api-notifications com:');
        console.log('      FIREBASE_PROJECT_ID=elevi-tcc');
        console.log('      FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"');
        console.log('      FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@elevi-tcc.iam.gserviceaccount.com');
        console.log('\n   Ou use FIREBASE_SERVICE_ACCOUNT com o JSON completo como string.');
      }
    }
  } catch (error) {
    console.error('❌ Erro ao inicializar Firebase Admin:', error.message);
    console.error('\n📋 Para configurar o Firebase Admin SDK:');
    console.error('   1. Acesse: https://console.firebase.google.com/project/elevi-tcc/settings/serviceaccounts/adminsdk');
    console.error('   2. Clique em "Gerar nova chave privada"');
    console.error('   3. Baixe o arquivo JSON');
    console.error('   4. Configure no arquivo .env da API (veja .env.example)');
    console.error('\n⚠️  A API continuará rodando, mas não poderá enviar notificações até configurar as credenciais.');
    // Não faz exit para permitir que a API continue rodando
    // Apenas não poderá enviar notificações
  }
}

// Verificar se as credenciais estão configuradas
let hasCredentials = false;
try {
  // Verificar se há arquivo de credenciais
  const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
  const hasServiceAccountFile = fs.existsSync(serviceAccountPath);
  
  if (hasServiceAccountFile || process.env.FIREBASE_SERVICE_ACCOUNT || 
      (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL)) {
    hasCredentials = true;
    if (hasServiceAccountFile) {
      console.log('✅ Credenciais do Firebase Admin SDK detectadas no arquivo serviceAccountKey.json');
    } else {
      console.log('✅ Credenciais do Firebase Admin SDK detectadas nas variáveis de ambiente');
    }
  } else {
    // Tentar verificar se o app foi inicializado com credenciais
    try {
      const app = admin.app();
      // Se o app tem credential configurado, então tem credenciais
      hasCredentials = app.options && app.options.credential !== undefined;
      if (!hasCredentials) {
        console.warn('⚠️  Firebase Admin SDK inicializado sem credenciais completas');
        console.warn('⚠️  A API não poderá acessar o Firestore ou enviar notificações');
      }
    } catch (error) {
      hasCredentials = false;
    }
  }
} catch (error) {
  hasCredentials = false;
  console.warn('⚠️  Não foi possível verificar as credenciais do Firebase Admin SDK');
}

const db = admin.firestore();

/**
 * Verifica se as credenciais do Firebase Admin estão configuradas
 */
function checkCredentials() {
  if (!hasCredentials) {
    const error = new Error('Firebase Admin SDK não está configurado com credenciais');
    error.statusCode = 503;
    error.details = {
      message: 'Configure FIREBASE_SERVICE_ACCOUNT ou FIREBASE_PRIVATE_KEY/FIREBASE_CLIENT_EMAIL no arquivo .env',
      instructions: [
        '1. Acesse: https://console.firebase.google.com/project/elevi-tcc/settings/serviceaccounts/adminsdk',
        '2. Clique em "Gerar nova chave privada"',
        '3. Baixe o arquivo JSON',
        '4. Configure no arquivo .env da pasta api-notifications:',
        '   FIREBASE_PROJECT_ID=elevi-tcc',
        '   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"',
        '   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@elevi-tcc.iam.gserviceaccount.com',
        '',
        'Ou use FIREBASE_SERVICE_ACCOUNT com o JSON completo como string'
      ]
    };
    throw error;
  }
}

/**
 * Envia notificação para um usuário específico
 */
app.post('/api/notifications/send', async (req, res) => {
  try {
    checkCredentials();
    
    const { userId, title, body, data } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({
        error: 'Campos obrigatórios: userId, title, body'
      });
    }

    // Buscar token do usuário no Firestore
    const tokenDoc = await db.collection('tokens').doc(userId).get();
    
    if (!tokenDoc.exists) {
      return res.status(404).json({
        error: 'Token não encontrado para este usuário'
      });
    }

    const tokenData = tokenDoc.data();
    const fcmToken = tokenData.token;

    if (!fcmToken) {
      return res.status(404).json({
        error: 'Token FCM não encontrado para este usuário'
      });
    }

    // Preparar mensagem
    const message = {
      token: fcmToken,
      notification: {
        title,
        body,
      },
      data: data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
    };

    // Enviar notificação
    const response = await admin.messaging().send(message);
    
    console.log('Notificação enviada com sucesso:', response);

    res.json({
      success: true,
      messageId: response,
      message: 'Notificação enviada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    
    // Se for erro de credenciais, retorna mensagem mais clara
    if (error.statusCode === 503 || error.message.includes('credentials') || 
        error.message.includes('Could not load') || error.message.includes('default credentials')) {
      return res.status(503).json({
        error: 'Firebase Admin SDK não configurado',
        message: error.details?.message || 'Configure as credenciais de Service Account no arquivo .env',
        instructions: error.details?.instructions || [
          'Acesse: https://console.firebase.google.com/project/elevi-tcc/settings/serviceaccounts/adminsdk',
          'Gere uma nova chave privada e configure no arquivo .env'
        ],
        details: error.message
      });
    }
    
    if (error.code === 'messaging/invalid-registration-token' || 
        error.code === 'messaging/registration-token-not-registered') {
      // Token inválido, remover do Firestore
      const { userId } = req.body;
      if (userId) {
        try {
          await db.collection('tokens').doc(userId).delete();
        } catch (deleteError) {
          console.error('Erro ao deletar token inválido:', deleteError);
        }
      }
      return res.status(400).json({
        error: 'Token inválido ou não registrado',
        code: error.code
      });
    }

    res.status(500).json({
      error: 'Erro ao enviar notificação',
      message: error.message
    });
  }
});

/**
 * Envia notificação para múltiplos usuários
 */
app.post('/api/notifications/send-multiple', async (req, res) => {
  try {
    checkCredentials();
    
    const { userIds, title, body, data } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        error: 'userIds deve ser um array não vazio'
      });
    }

    if (!title || !body) {
      return res.status(400).json({
        error: 'Campos obrigatórios: title, body'
      });
    }

    // Buscar tokens de todos os usuários
    const tokens = [];
    const invalidUserIds = [];

    for (const userId of userIds) {
      try {
        const tokenDoc = await db.collection('tokens').doc(userId).get();
        
        if (tokenDoc.exists && tokenDoc.data().token) {
          tokens.push(tokenDoc.data().token);
        } else {
          invalidUserIds.push(userId);
        }
      } catch (error) {
        console.error(`Erro ao buscar token do usuário ${userId}:`, error);
        invalidUserIds.push(userId);
      }
    }

    if (tokens.length === 0) {
      return res.status(404).json({
        error: 'Nenhum token válido encontrado',
        invalidUserIds
      });
    }

    // Preparar mensagem multicast
    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
      tokens,
    };

    // Enviar notificações
    const response = await admin.messaging().sendEachForMulticast(message);
    
    console.log(`Notificações enviadas: ${response.successCount} sucesso, ${response.failureCount} falhas`);

    // Remover tokens inválidos
    if (response.failureCount > 0) {
      const invalidTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success && 
            (resp.error?.code === 'messaging/invalid-registration-token' || 
             resp.error?.code === 'messaging/registration-token-not-registered')) {
          invalidTokens.push(tokens[idx]);
        }
      });

      // Buscar e remover tokens inválidos do Firestore
      for (const invalidToken of invalidTokens) {
        const tokenQuery = await db.collection('tokens')
          .where('token', '==', invalidToken)
          .get();
        
        tokenQuery.forEach(async (doc) => {
          await doc.ref.delete();
        });
      }
    }

    res.json({
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      invalidUserIds,
      message: `Notificações enviadas: ${response.successCount} sucesso, ${response.failureCount} falhas`
    });
  } catch (error) {
    console.error('Erro ao enviar notificações múltiplas:', error);
    
    // Se for erro de credenciais, retorna mensagem mais clara
    if (error.statusCode === 503 || error.message.includes('credentials') || 
        error.message.includes('Could not load') || error.message.includes('default credentials')) {
      return res.status(503).json({
        error: 'Firebase Admin SDK não configurado',
        message: error.details?.message || 'Configure as credenciais de Service Account no arquivo .env',
        instructions: error.details?.instructions || [
          'Acesse: https://console.firebase.google.com/project/elevi-tcc/settings/serviceaccounts/adminsdk',
          'Gere uma nova chave privada e configure no arquivo .env'
        ],
        details: error.message
      });
    }
    
    res.status(500).json({
      error: 'Erro ao enviar notificações',
      message: error.message
    });
  }
});

/**
 * Envia notificação para todos os usuários
 */
app.post('/api/notifications/send-all', async (req, res) => {
  try {
    checkCredentials();
    
    const { title, body, data } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        error: 'Campos obrigatórios: title, body'
      });
    }

    // Buscar todos os tokens válidos
    const tokensSnapshot = await db.collection('tokens')
      .where('token', '!=', null)
      .get();

    if (tokensSnapshot.empty) {
      return res.status(404).json({
        error: 'Nenhum token encontrado'
      });
    }

    const tokens = [];
    tokensSnapshot.forEach((doc) => {
      const token = doc.data().token;
      if (token) {
        tokens.push(token);
      }
    });

    if (tokens.length === 0) {
      return res.status(404).json({
        error: 'Nenhum token válido encontrado'
      });
    }

    // Preparar mensagem multicast
    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
      tokens,
    };

    // Enviar notificações em lotes (FCM limita a 500 tokens por vez)
    const batchSize = 500;
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < tokens.length; i += batchSize) {
      const batch = tokens.slice(i, i + batchSize);
      const batchMessage = { ...message, tokens: batch };
      
      try {
        const response = await admin.messaging().sendEachForMulticast(batchMessage);
        successCount += response.successCount;
        failureCount += response.failureCount;
      } catch (error) {
        console.error(`Erro ao enviar lote ${i / batchSize + 1}:`, error);
        failureCount += batch.length;
      }
    }

    res.json({
      success: true,
      successCount,
      failureCount,
      totalTokens: tokens.length,
      message: `Notificações enviadas: ${successCount} sucesso, ${failureCount} falhas`
    });
  } catch (error) {
    console.error('Erro ao enviar notificações para todos:', error);
    
    // Se for erro de credenciais, retorna mensagem mais clara
    if (error.statusCode === 503 || error.message.includes('credentials') || 
        error.message.includes('Could not load') || error.message.includes('default credentials')) {
      return res.status(503).json({
        error: 'Firebase Admin SDK não configurado',
        message: error.details?.message || 'Configure as credenciais de Service Account no arquivo .env',
        instructions: error.details?.instructions || [
          'Acesse: https://console.firebase.google.com/project/elevi-tcc/settings/serviceaccounts/adminsdk',
          'Gere uma nova chave privada e configure no arquivo .env'
        ],
        details: error.message
      });
    }
    
    res.status(500).json({
      error: 'Erro ao enviar notificações',
      message: error.message
    });
  }
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'api-notifications',
    credentialsConfigured: hasCredentials
  });
});

app.listen(PORT, () => {
  console.log(`🚀 API de Notificações rodando na porta ${PORT}`);
});

