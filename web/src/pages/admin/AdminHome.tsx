import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SchoolIcon from '@mui/icons-material/School';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import GroupIcon from '@mui/icons-material/Group';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PaletteIcon from '@mui/icons-material/Palette';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import ManageVideos from './ManageVideos';
import ManageCourses from './ManageCourses';
import ManageUsers from './ManageUsers';
import Notifications from './Notifications';
import Customize from './Customize';
import ManagePlans from './ManagePlans';
import './AdminHome.css';

const AdminHome: React.FC = () => {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState('courses');

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <div className="contentBoxAdmin">
      <div className="sidebarContent">
        <h2 className="sidebarTitle">Meu Painel</h2>
        <ul className="sidebarList">
          <li 
            className={selectedTab === 'courses' ? 'active' : ''}
            onClick={() => setSelectedTab('courses')}
          >
            <SchoolIcon />
            <span>Gerenciar Cursos</span>
          </li>
          <li 
            className={selectedTab === 'videos' ? 'active' : ''}
            onClick={() => setSelectedTab('videos')}
          >
            <VideoLibraryIcon />
            <span>Gerenciar Vídeos</span>
          </li>
          <li 
            className={selectedTab === 'users' ? 'active' : ''}
            onClick={() => setSelectedTab('users')}
          >
            <GroupIcon />
            <span>Gerenciar Usuários</span>
          </li>
          <li 
            className={selectedTab === 'notifications' ? 'active' : ''}
            onClick={() => setSelectedTab('notifications')}
          >
            <NotificationsIcon />
            <span>Notificações</span>
          </li>
          <li 
            className={selectedTab === 'customize' ? 'active' : ''}
            onClick={() => setSelectedTab('customize')}
          >
            <PaletteIcon />
            <span>Personalizar Layout</span>
          </li>
          <li 
            className={selectedTab === 'plans' ? 'active' : ''}
            onClick={() => setSelectedTab('plans')}
          >
            <CardMembershipIcon />
            <span>Gerenciar Planos</span>
          </li>
        </ul>
        <div className="sidebarFooter">
          <span
            style={{ cursor: 'pointer', color: '#edebe9', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}
            onClick={() => navigate('/')}
          >
            ↩ Voltar para Home
          </span>
          <span
            style={{ cursor: 'pointer', color: '#edebe9', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}
            onClick={handleLogout}
          >
            🚪 Sair
          </span>
        </div>
      </div>
      <div className="contentAdmin">
        <header className="headerContentAdmin">
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <h2>Painel Administrativo</h2>
            <span style={{ color: 'var(--primary-color)', opacity: 0.7, fontSize: '14px' }}>
              Admin: {userData?.name}
            </span>
          </div>
        </header>
        <div>
          {selectedTab === 'videos' && <ManageVideos />}
          {selectedTab === 'courses' && <ManageCourses />}
          {selectedTab === 'users' && <ManageUsers />}
          {selectedTab === 'notifications' && <Notifications />}
          {selectedTab === 'customize' && <Customize />}
          {selectedTab === 'plans' && <ManagePlans />}
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
