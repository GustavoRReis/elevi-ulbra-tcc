import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Plan } from '../types';
import Logo from '../components/Logo';
import './Plans.css';

const Plans: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const plansQuery = query(
        collection(db, 'plans'),
        orderBy('periodMonths', 'asc')
      );
      const querySnapshot = await getDocs(plansQuery);
      const plansData = querySnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as Plan[];
      setPlans(plansData.filter(plan => plan.isActive));
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan: Plan) => {
    navigate(`/checkout/${plan.uid}`);
  };

  if (loading) {
    return <div className="loading">Carregando planos...</div>;
  }

  return (
    <div className="plans-page">
      <header className="headerHome">
        <div className="left">
          <Logo />
        </div>
        <div className="right">
          <button onClick={() => navigate('/')} className="btn-back-header">
            ← Voltar
          </button>
        </div>
      </header>

      <main className="plans-main">
        <div className="plans-header">
          <h1 className="plans-title">Escolha seu Plano</h1>
          <p className="plans-subtitle">Selecione o plano ideal para você</p>
        </div>

        {plans.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum plano disponível no momento.</p>
          </div>
        ) : (
          <div className="plans-grid">
            {plans.map((plan) => (
              <div key={plan.uid} className="plan-card">
                <div className="plan-card-header">
                  <h2 className="plan-card-name">{plan.name}</h2>
                  {plan.description && (
                    <p className="plan-card-description">{plan.description}</p>
                  )}
                </div>
                <div className="plan-card-pricing">
                  <div className="plan-card-monthly">
                    <span className="plan-card-price-value">
                      R$ {plan.monthlyPrice.toFixed(2)}
                    </span>
                    <span className="plan-card-price-label">/mês</span>
                  </div>
                  <div className="plan-card-total">
                    <span className="plan-card-total-label">ou</span>
                    <span className="plan-card-total-value">
                      R$ {plan.totalPrice.toFixed(2)}
                    </span>
                    <span className="plan-card-total-label">à vista</span>
                  </div>
                </div>
                <div className="plan-card-period">
                  <span className="plan-card-period-label">Período:</span>
                  <span className="plan-card-period-value">{plan.period}</span>
                </div>
                <button
                  className="plan-card-button"
                  onClick={() => handleSelectPlan(plan)}
                >
                  Assinar Plano
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Plans;

