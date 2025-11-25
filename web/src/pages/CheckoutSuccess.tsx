import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plan } from '../types';
import Logo from '../components/Logo';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import './CheckoutSuccess.css';

const CheckoutSuccess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const plan = location.state?.plan as Plan | undefined;

  useEffect(() => {
    if (!plan) {
      navigate('/plans');
    }
  }, [plan, navigate]);

  if (!plan) {
    return null;
  }

  return (
    <div className="checkout-success-page">
      <header className="headerHome">
        <div className="left">
          <Logo />
        </div>
      </header>

      <main className="checkout-success-main">
        <div className="success-card">
          <CheckCircleIcon className="success-icon" />
          <h1 className="success-title">Compra Realizada com Sucesso!</h1>
          <p className="success-message">
            Seu plano <strong>{plan.name}</strong> foi ativado com sucesso.
          </p>
          <div className="success-details">
            <div className="success-detail-item">
              <span className="detail-label">Plano:</span>
              <span className="detail-value">{plan.name}</span>
            </div>
            <div className="success-detail-item">
              <span className="detail-label">Período:</span>
              <span className="detail-value">{plan.period}</span>
            </div>
            <div className="success-detail-item">
              <span className="detail-label">Valor Total:</span>
              <span className="detail-value">R$ {plan.totalPrice.toFixed(2)}</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="btn-success-home"
          >
            Voltar para Home
          </button>
        </div>
      </main>
    </div>
  );
};

export default CheckoutSuccess;

