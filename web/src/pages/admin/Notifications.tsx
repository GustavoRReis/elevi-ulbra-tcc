import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { API_NOTIFICATIONS_URL } from '../../config/api';
import './Notifications.css';

const Notifications: React.FC = () => {
  const [formData, setFormData] = useState({ title: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setMessageType('success');

    try {
      // Salvar notificação no Firestore (histórico)
      const notificationData = {
        title: formData.title,
        message: formData.message,
        createdAt: new Date(),
        userId: null // Sempre null pois sempre envia para todos
      };

      await addDoc(collection(db, 'notifications'), notificationData);

      // Enviar notificação push via API - sempre para todos
      const apiResponse = await fetch(`${API_NOTIFICATIONS_URL}/api/notifications/send-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          body: formData.message,
          data: {
            type: 'notification',
            timestamp: new Date().toISOString(),
          }
        }),
      });

      const apiData = await apiResponse.json();

      if (!apiResponse.ok) {
        // Se for erro de credenciais, mostra mensagem mais detalhada
        if (apiResponse.status === 503 && apiData.error?.includes('Firebase Admin SDK')) {
          throw new Error(
            apiData.message || apiData.error || 'Firebase Admin SDK não está configurado na API. ' +
            'Configure as credenciais de Service Account no arquivo .env da API.'
          );
        }
        throw new Error(apiData.error || apiData.message || 'Erro ao enviar notificação push');
      }

      // Mensagem de sucesso com detalhes
      const successMessage = `Notificação enviada com sucesso! ${apiData.successCount || 0} usuários notificados.`;

      setMessage(successMessage);
      setMessageType('success');
      setFormData({ title: '', message: '' });
    } catch (error: any) {
      console.error('Erro ao enviar notificação:', error);
      
      // Mensagem mais clara para erros de credenciais
      let errorMessage = error.message || 'Erro ao enviar notificação. Verifique se a API está rodando.';
      
      if (error.message?.includes('Firebase Admin SDK') || error.message?.includes('credentials')) {
        errorMessage = 'Erro: Firebase Admin SDK não está configurado na API. ' +
          'Configure as credenciais de Service Account no arquivo .env da API. ' +
          'Veja: https://console.firebase.google.com/project/elevi-tcc/settings/serviceaccounts/adminsdk';
      }
      
      setMessage(errorMessage);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="notification-management">
      <div className="notification-management-header">
        <h2>Enviar Notificações</h2>
        <p>Envie notificações para os usuários do sistema</p>
      </div>

        {message && (
          <div className={messageType === 'success' ? 'success-message' : 'error-message'}>
            {message}
          </div>
        )}

        <div className="notification-form-container">
          <form onSubmit={handleSubmit} className="notification-form">
            <div className="form-group">
              <label>Título da Notificação</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="Digite o título"
              />
            </div>
            <div className="form-group">
              <label>Mensagem</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                rows={5}
                placeholder="Digite a mensagem da notificação"
              ></textarea>
            </div>
            <div className="form-group">
              <p style={{ color: 'var(--primary-color)', opacity: 0.7, fontSize: '14px', margin: 0 }}>
                A notificação será enviada para todos os usuários cadastrados no sistema.
              </p>
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Enviando...' : 'Enviar Notificação para Todos'}
            </button>
          </form>
        </div>
    </div>
  );
};

export default Notifications;

