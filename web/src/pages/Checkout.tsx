import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Plan, User } from '../types';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import './Checkout.css';

const Checkout: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    installments: '1'
  });

  useEffect(() => {
    fetchPlan();
  }, [planId]);

  const fetchPlan = async () => {
    if (!planId) {
      navigate('/plans');
      return;
    }

    try {
      const planDoc = await getDoc(doc(db, 'plans', planId));
      if (planDoc.exists()) {
        setPlan({ uid: planDoc.id, ...planDoc.data() } as Plan);
      } else {
        navigate('/plans');
      }
    } catch (error) {
      console.error('Erro ao buscar plano:', error);
      navigate('/plans');
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setFormData({ ...formData, cardNumber: formatted });
  };

  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value);
    setFormData({ ...formData, expiryDate: formatted });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    // Simular processamento de pagamento
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      if (!userData || !plan) return;

      // Atualizar usuário com planActive e informações do plano
      await updateDoc(doc(db, 'users', userData.uid), {
        planActive: true,
        planType: plan.name,
        idPlan: plan.uid,
        planStartedAt: new Date(),
        planEndDate: new Date(Date.now() + plan.periodMonths * 30 * 24 * 60 * 60 * 1000)
      });

      // Criar registro na subcoleção de planos do usuário
      await setDoc(doc(db, 'users', userData.uid, 'plans', plan.uid), {
        planId: plan.uid,
        planName: plan.name,
        status: 'active',
        startedAt: new Date(),
        endDate: new Date(Date.now() + plan.periodMonths * 30 * 24 * 60 * 60 * 1000),
        totalPrice: plan.totalPrice,
        monthlyPrice: plan.monthlyPrice,
        period: plan.period,
        paymentMethod: 'credit_card',
        installments: parseInt(formData.installments)
      });

      // Redirecionar para página de sucesso
      navigate('/checkout/success', { state: { plan } });
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="checkout-page">
        <div className="loading">Carregando...</div>
      </div>
    );
  }

  if (!plan) {
    return null;
  }

  const installmentValue = plan.totalPrice / parseInt(formData.installments);

  return (
    <div className="checkout-page">
      <header className="headerHome">
        <div className="left">
          <Logo />
        </div>
        <div className="right">
          <button onClick={() => navigate('/plans')} className="btn-back-header">
            ← Voltar
          </button>
        </div>
      </header>

      <main className="checkout-main">
        <div className="checkout-container">
          <div className="checkout-summary">
            <h2 className="checkout-title">Resumo do Pedido</h2>
            <div className="summary-card">
              <div className="summary-plan">
                <h3>{plan.name}</h3>
                <p className="summary-period">{plan.period}</p>
                {plan.description && (
                  <p className="summary-description">{plan.description}</p>
                )}
              </div>
              <div className="summary-pricing">
                <div className="summary-total">
                  <span className="summary-label">Valor Total:</span>
                  <span className="summary-value">R$ {plan.totalPrice.toFixed(2)}</span>
                </div>
                <div className="summary-monthly">
                  <span className="summary-label">Valor Mensal:</span>
                  <span className="summary-value">R$ {plan.monthlyPrice.toFixed(2)}/mês</span>
                </div>
              </div>
            </div>
          </div>

          <div className="checkout-form-container">
            <h2 className="checkout-title">Dados de Pagamento</h2>
            <form onSubmit={handleSubmit} className="checkout-form">
              <div className="form-group">
                <label>Número do Cartão</label>
                <input
                  type="text"
                  value={formData.cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  required
                />
              </div>

              <div className="form-group">
                <label>Nome no Cartão</label>
                <input
                  type="text"
                  value={formData.cardName}
                  onChange={(e) => setFormData({ ...formData, cardName: e.target.value.toUpperCase() })}
                  placeholder="NOME COMPLETO"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Validade</label>
                  <input
                    type="text"
                    value={formData.expiryDate}
                    onChange={handleExpiryDateChange}
                    placeholder="MM/AA"
                    maxLength={5}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>CVV</label>
                  <input
                    type="text"
                    value={formData.cvv}
                    onChange={(e) => setFormData({ ...formData, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                    placeholder="123"
                    maxLength={3}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Número de Parcelas</label>
                <select
                  value={formData.installments}
                  onChange={(e) => setFormData({ ...formData, installments: e.target.value })}
                  required
                >
                  {Array.from({ length: plan.periodMonths }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num.toString()}>
                      {num}x de R$ {(plan.totalPrice / num).toFixed(2)} sem juros
                    </option>
                  ))}
                </select>
              </div>

              <div className="checkout-total">
                <div className="checkout-total-row">
                  <span>Total a pagar:</span>
                  <span className="checkout-total-value">R$ {plan.totalPrice.toFixed(2)}</span>
                </div>
                {parseInt(formData.installments) > 1 && (
                  <div className="checkout-total-installments">
                    <span>{formData.installments}x de R$ {installmentValue.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={processing}
                className="btn-checkout-submit"
              >
                {processing ? 'Processando...' : 'Finalizar Compra'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;

