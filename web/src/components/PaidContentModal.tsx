import React from 'react';
import { useNavigate } from 'react-router-dom';
import LockIcon from '@mui/icons-material/Lock';
import CloseIcon from '@mui/icons-material/Close';
import './PaidContentModal.css';

interface PaidContentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PaidContentModal: React.FC<PaidContentModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleGoToPlans = () => {
    onClose();
    navigate('/plans');
  };

  return (
    <div className="paid-content-modal-overlay" onClick={onClose}>
      <div className="paid-content-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="btn-close-modal" onClick={onClose}>
          <CloseIcon />
        </button>
        <div className="paid-content-icon">
          <LockIcon style={{ fontSize: '64px' }} />
        </div>
        <h2 className="paid-content-title">Conteúdo Exclusivo</h2>
        <p className="paid-content-message">
          Este conteúdo faz parte de um plano premium. Assine um plano para ter acesso completo a todos os conteúdos.
        </p>
        <div className="paid-content-actions">
          <button onClick={handleGoToPlans} className="btn-go-to-plans">
            Ver Planos Disponíveis
          </button>
          <button onClick={onClose} className="btn-cancel-modal">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaidContentModal;

