import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Plan } from '../../types';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import './ManagePlans.css';

const ManagePlans: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    totalPrice: '',
    period: '',
    periodMonths: '',
    description: ''
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const plansSnapshot = await getDocs(collection(db, 'plans'));
      const plansData = plansSnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as Plan[];
      setPlans(plansData.sort((a, b) => a.periodMonths - b.periodMonths));
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (plans.length >= 3 && !editingPlan) {
      alert('Você pode criar no máximo 3 planos.');
      return;
    }

    const periodMonths = parseInt(formData.periodMonths);
    const totalPrice = parseFloat(formData.totalPrice);
    
    if (periodMonths <= 0) {
      alert('O período deve ser maior que zero.');
      return;
    }

    if (totalPrice <= 0) {
      alert('O valor total deve ser maior que zero.');
      return;
    }

    // Calcular valor mensal automaticamente
    const monthlyPrice = totalPrice / periodMonths;

    try {
      const planData = {
        name: formData.name,
        monthlyPrice: Math.round(monthlyPrice * 100) / 100, // Arredondar para 2 casas decimais
        totalPrice: totalPrice,
        period: formData.period,
        periodMonths: periodMonths,
        description: formData.description || '',
        isActive: true,
        createdAt: editingPlan ? editingPlan.createdAt : new Date()
      };

      if (editingPlan) {
        await updateDoc(doc(db, 'plans', editingPlan.uid), planData);
      } else {
        await addDoc(collection(db, 'plans'), planData);
      }

      setFormData({ name: '', totalPrice: '', period: '', periodMonths: '', description: '' });
      setShowForm(false);
      setEditingPlan(null);
      fetchPlans();
    } catch (error) {
      console.error('Erro ao salvar plano:', error);
      alert('Erro ao salvar plano');
    }
  };

  const handleDelete = async (planId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este plano?')) return;

    try {
      await deleteDoc(doc(db, 'plans', planId));
      fetchPlans();
    } catch (error) {
      console.error('Erro ao excluir plano:', error);
      alert('Erro ao excluir plano');
    }
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      totalPrice: plan.totalPrice.toString(),
      period: plan.period,
      periodMonths: plan.periodMonths.toString(),
      description: plan.description || ''
    });
    setShowForm(true);
  };

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div className="plans-management">
      <div className="plans-management-header">
        <div>
          <h2>Gerenciar Planos</h2>
          <p>Administre os planos disponíveis (máximo de 3 planos)</p>
        </div>
        {plans.length < 3 && (
          <button
            onClick={() => {
              setShowForm(true);
              setEditingPlan(null);
              setFormData({ name: '', totalPrice: '', period: '', periodMonths: '', description: '' });
            }}
            className="btn-add-plan"
          >
            <AddIcon /> Novo Plano
          </button>
        )}
      </div>

      {showForm && (
        <div className="form-modal">
          <div className="form-content">
            <h2>{editingPlan ? 'Editar' : 'Novo'} Plano</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nome do Plano</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Ex: Plano Básico"
                />
              </div>
              <div className="form-group">
                <label>Valor Total do Plano (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.totalPrice}
                  onChange={(e) => setFormData({ ...formData, totalPrice: e.target.value })}
                  required
                  placeholder="0.00"
                />
                {formData.totalPrice && formData.periodMonths && (
                  <small className="form-hint">
                    Valor mensal calculado: R$ {(parseFloat(formData.totalPrice) / parseInt(formData.periodMonths || '1')).toFixed(2)}/mês
                  </small>
                )}
              </div>
              <div className="form-group">
                <label>Período (ex: "1 mês", "3 meses", "12 meses")</label>
                <input
                  type="text"
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                  required
                  placeholder="Ex: 12 meses"
                />
              </div>
              <div className="form-group">
                <label>Número de Meses</label>
                <input
                  type="number"
                  min="1"
                  value={formData.periodMonths}
                  onChange={(e) => setFormData({ ...formData, periodMonths: e.target.value })}
                  required
                  placeholder="12"
                />
                {formData.totalPrice && formData.periodMonths && (
                  <small className="form-hint">
                    O valor será dividido em {formData.periodMonths} parcelas de R$ {(parseFloat(formData.totalPrice) / parseInt(formData.periodMonths || '1')).toFixed(2)}
                  </small>
                )}
              </div>
              <div className="form-group">
                <label>Descrição (opcional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Descrição do plano"
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">Salvar</button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPlan(null);
                    setFormData({ name: '', totalPrice: '', period: '', periodMonths: '', description: '' });
                  }}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="plans-list">
        {plans.length === 0 ? (
          <div className="empty-state">Nenhum plano cadastrado</div>
        ) : (
          plans.map((plan) => (
            <div key={plan.uid} className="plan-item">
              <div className="plan-info">
                <h3>{plan.name}</h3>
                <p className="plan-price">
                  <span className="monthly-price">R$ {plan.monthlyPrice.toFixed(2)}/mês</span>
                  <span className="total-price">ou R$ {plan.totalPrice.toFixed(2)} à vista</span>
                </p>
                <p className="plan-period">{plan.period}</p>
                {plan.description && <p className="plan-description">{plan.description}</p>}
              </div>
              <div className="plan-actions">
                <button onClick={() => handleEdit(plan)} className="btn-edit">
                  Editar
                </button>
                <button onClick={() => handleDelete(plan.uid)} className="btn-delete">
                  <DeleteIcon /> Excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ManagePlans;

