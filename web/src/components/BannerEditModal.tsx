import React, { useState, useEffect } from 'react';
import { useTexts } from '../context/TextsContext';
import CloseIcon from '@mui/icons-material/Close';
import './BannerEditModal.css';

interface BannerEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BannerEditModal: React.FC<BannerEditModalProps> = ({ isOpen, onClose }) => {
  const { texts, updateTexts } = useTexts();
  const [formData, setFormData] = useState({
    bannerTitle: texts.bannerTitle,
    bannerSubtitle: texts.bannerSubtitle,
    bannerButtonText: texts.bannerButtonText
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData({
        bannerTitle: texts.bannerTitle,
        bannerSubtitle: texts.bannerSubtitle,
        bannerButtonText: texts.bannerButtonText
      });
      setMessage('');
    }
  }, [isOpen, texts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await updateTexts(formData);
      setMessage('Textos do banner atualizados com sucesso!');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Erro ao salvar textos:', error);
      setMessage('Erro ao salvar textos');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="banner-edit-modal-overlay" onClick={onClose}>
      <div className="banner-edit-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="banner-edit-modal-header">
          <h2>Editar Textos do Banner</h2>
          <button className="btn-close-modal" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        {message && (
          <div className={message.includes('sucesso') ? 'success-message' : 'error-message'}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="banner-edit-form">
          <div className="form-group">
            <label>Título do Banner</label>
            <input
              type="text"
              value={formData.bannerTitle}
              onChange={(e) => setFormData({ ...formData, bannerTitle: e.target.value })}
              placeholder="Bem-vindo ao {companyName}"
            />
            <small>Use {'{companyName}'} para incluir o nome da empresa</small>
          </div>

          <div className="form-group">
            <label>Subtítulo do Banner</label>
            <input
              type="text"
              value={formData.bannerSubtitle}
              onChange={(e) => setFormData({ ...formData, bannerSubtitle: e.target.value })}
              placeholder="Transforme sua vida através do conhecimento"
            />
          </div>

          <div className="form-group">
            <label>Texto do Botão</label>
            <input
              type="text"
              value={formData.bannerButtonText}
              onChange={(e) => setFormData({ ...formData, bannerButtonText: e.target.value })}
              placeholder="Iniciar jornada"
            />
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BannerEditModal;

