# API de Notificações

API Node.js para envio de notificações push via Firebase Cloud Messaging (FCM).

## Configuração

1. Instale as dependências:
```bash
npm install
```

2. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

3. Configure o Firebase Admin SDK:
   - Acesse o [Console do Firebase](https://console.firebase.google.com/)
   - Vá em Configurações do Projeto > Contas de Serviço
   - Gere uma nova chave privada
   - Copie o JSON e configure no `.env` usando uma das opções:
     - **Opção 1**: Cole o JSON completo na variável `FIREBASE_SERVICE_ACCOUNT`
     - **Opção 2**: Use as variáveis individuais `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`

## Executar

```bash
# Desenvolvimento (com nodemon)
npm run dev

# Produção
npm start
```

A API estará rodando em `http://localhost:3001`

## Endpoints

### POST `/api/notifications/send`
Envia notificação para um usuário específico.

**Body:**
```json
{
  "userId": "uid-do-usuario",
  "title": "Título da notificação",
  "body": "Corpo da notificação",
  "data": {
    "key": "value"
  }
}
```

### POST `/api/notifications/send-multiple`
Envia notificação para múltiplos usuários.

**Body:**
```json
{
  "userIds": ["uid1", "uid2", "uid3"],
  "title": "Título da notificação",
  "body": "Corpo da notificação",
  "data": {
    "key": "value"
  }
}
```

### POST `/api/notifications/send-all`
Envia notificação para todos os usuários registrados.

**Body:**
```json
{
  "title": "Título da notificação",
  "body": "Corpo da notificação",
  "data": {
    "key": "value"
  }
}
```

### GET `/health`
Health check da API.

## Exemplo de Uso

```javascript
// Enviar notificação para um usuário
fetch('http://localhost:3001/api/notifications/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    userId: 'abc123',
    title: 'Nova atualização!',
    body: 'Você tem uma nova mensagem',
    data: {
      type: 'message',
      id: '123'
    }
  })
});
```

