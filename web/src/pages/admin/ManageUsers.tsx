import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, getDocs as getPlansDocs, addDoc as addPlanDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { User, UserPlan } from '../../types';
import './ManageUsers.css';

const ManageUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userPlans, setUserPlans] = useState<UserPlan[]>([]);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [planFormData, setPlanFormData] = useState({ name: '', price: 0, status: 'active' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as User[];
      setUsers(usersData);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPlans = async (userId: string) => {
    try {
      const plansSnapshot = await getPlansDocs(collection(db, 'users', userId, 'plans'));
      const plansData = plansSnapshot.docs.map(doc => ({
        id: doc.id,
        userId: userId,
        planId: doc.data().planId || '',
        status: doc.data().status || 'active',
        startedAt: doc.data().startedAt,
        endDate: doc.data().endDate,
        paymentId: doc.data().paymentId
      })) as UserPlan[];
      setUserPlans(plansData);
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
    }
  };

  const handleToggleAdmin = async (user: User) => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        isAdmin: !user.isAdmin
      });
      fetchUsers();
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      alert('Erro ao atualizar usuário');
    }
  };

  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const planData = {
        ...planFormData,
        startedAt: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
      };
      await addPlanDoc(collection(db, 'users', selectedUser.uid, 'plans'), planData);
      await updateDoc(doc(db, 'users', selectedUser.uid), {
        planType: planFormData.name,
        idPlan: 'new'
      });
      setPlanFormData({ name: '', price: 0, status: 'active' });
      setShowPlanForm(false);
      fetchUserPlans(selectedUser.uid);
      fetchUsers();
    } catch (error) {
      console.error('Erro ao criar plano:', error);
      alert('Erro ao criar plano');
    }
  };

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div className="user-management">
      <div className="user-management-header">
        <h2>Gerenciar Usuários, Planos e Assinaturas</h2>
        <p>Administre usuários, planos e assinaturas do sistema</p>
      </div>

        {showPlanForm && selectedUser && (
          <div className="form-modal">
            <div className="form-content">
              <h2>Criar Plano para {selectedUser.name}</h2>
              <form onSubmit={handlePlanSubmit}>
                <div className="form-group">
                  <label>Nome do Plano</label>
                  <input type="text" value={planFormData.name} onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Preço (R$)</label>
                  <input type="number" step="0.01" value={planFormData.price} onChange={(e) => setPlanFormData({ ...planFormData, price: parseFloat(e.target.value) })} required />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={planFormData.status} onChange={(e) => setPlanFormData({ ...planFormData, status: e.target.value })} required>
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                    <option value="expired">Expirado</option>
                  </select>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-primary">Salvar</button>
                  <button type="button" onClick={() => { setShowPlanForm(false); setSelectedUser(null); }} className="btn-secondary">Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="users-list">
          {users.length === 0 ? (
            <div className="empty-state">Nenhum usuário cadastrado</div>
          ) : (
            users.map((user) => (
              <div key={user.uid} className="user-item">
                <div className="user-info">
                  <h3>{user.name}</h3>
                  <p>{user.email}</p>
                  <div className="user-badges">
                    {user.isAdmin && <span className="badge admin">Admin</span>}
                    {user.planType && <span className="badge plan">{user.planType}</span>}
                  </div>
                </div>
                <div className="user-actions">
                  <button onClick={() => handleToggleAdmin(user)} className={user.isAdmin ? "btn-remove-admin" : "btn-make-admin"}>
                    {user.isAdmin ? 'Remover Admin' : 'Tornar Admin'}
                  </button>
                  <button onClick={() => { setSelectedUser(user); fetchUserPlans(user.uid); setShowPlanForm(true); }} className="btn-add-plan">
                    Gerenciar Plano
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
    </div>
  );
};

export default ManageUsers;

