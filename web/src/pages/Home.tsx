import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCustomization } from '../context/CustomizationContext';
import { useTexts } from '../context/TextsContext';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Course, Card } from '../types';
import { getYouTubeThumbnail } from '../utils/youtube';
import Logo from '../components/Logo';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import BannerMain from '../components/BannerMain/BannerMain';
import EditableText from '../components/EditableText';
import LockIcon from '@mui/icons-material/Lock';
import PaidContentModal from '../components/PaidContentModal';
import './Home.css';

interface CourseWithCards extends Course {
  cards: Card[];
}

const Home: React.FC = () => {
  const { userData, logout } = useAuth();
  const { customization } = useCustomization();
  const { texts, updateTexts } = useTexts();
  const navigate = useNavigate();
  const [coursesWithCards, setCoursesWithCards] = useState<CourseWithCards[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaidModal, setShowPaidModal] = useState(false);

  useEffect(() => {
    const fetchCoursesAndCards = async () => {
      try {
        const coursesQuery = query(
          collection(db, 'courses'),
          orderBy('createdAt', 'desc')
        );
        const coursesSnapshot = await getDocs(coursesQuery);
        
        const coursesData = await Promise.all(
          coursesSnapshot.docs.map(async (courseDoc) => {
            const course = { uid: courseDoc.id, ...courseDoc.data() } as Course;
            
            // Buscar cards do curso
            const cardsSnapshot = await getDocs(
              collection(db, 'courses', courseDoc.id, 'cards')
            );
            const cards = cardsSnapshot.docs.map(doc => {
              const data = doc.data();
              // Debug: verificar se imageUrl está presente
              if (!data.imageUrl) {
                console.warn(`Card ${doc.id} (${data.name}) não tem imageUrl`);
              }
              return {
                uid: doc.id,
                ...data
              };
            }) as Card[];
            
            return { ...course, cards };
          })
        );
        
        setCoursesWithCards(coursesData);
      } catch (error) {
        console.error('Erro ao buscar cursos e cards:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCoursesAndCards();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div className="home-page">
      <header className="headerHome">
        <div className="left">
          <Logo />
        </div>
        <div className="right">
          {userData?.isAdmin && (
            <button 
              onClick={() => navigate('/admin')} 
              className="btn-admin-panel"
              title="Painel Admin"
            >
              <SettingsIcon style={{ fontSize: '22px' }} />
            </button>
          )}
          <span className="user-greeting">Olá, {userData?.name}</span>
          <button 
            onClick={handleLogout} 
            className="btn-logout"
            title="Sair"
          >
            <LogoutIcon style={{ fontSize: '22px' }} />
          </button>
        </div>
      </header>
      
      <BannerMain />
      
      <main className="home-content">
        <EditableText
          text={texts.homeSectionTitle}
          textKey="homeSectionTitle"
          onEdit={async (key, value) => {
            await updateTexts({ [key]: value });
          }}
          className="section-title"
          as="h1"
        />
        <EditableText
          text={texts.homeSectionSubtitle}
          textKey="homeSectionSubtitle"
          onEdit={async (key, value) => {
            await updateTexts({ [key]: value });
          }}
          className="section-subtitle"
          as="p"
        />
        
        {coursesWithCards.length === 0 ? (
          <div className="empty-state">
            <EditableText
              text={texts.homeEmptyState}
              textKey="homeEmptyState"
              onEdit={async (key, value) => {
                await updateTexts({ [key]: value });
              }}
              className=""
              as="p"
            />
          </div>
        ) : (
          <div className="courses-container">
            {coursesWithCards.map((course) => (
              <div key={course.uid} className="course-section">
                <div className="course-header-info">
                  <h2 className="course-section-title">{course.name}</h2>
                  <p className="course-section-description">{course.description}</p>
                </div>
                {course.cards.length === 0 ? (
                  <div className="empty-state">
                    <p>Nenhum card disponível neste curso.</p>
                  </div>
                ) : (
                  <div className="cards-grid">
                    {course.cards.map((card) => {
                      // Usar a imagem do card
                      const cardImageUrl = card.imageUrl;
                      
                      // Verificar se o card é pago
                      const isPaidContent = card.isFree === false;
                      const hasAccess = userData?.isAdmin || userData?.planActive === true || card.isFree === true;
                      
                      const handleCardClick = () => {
                        if (isPaidContent && !hasAccess) {
                          setShowPaidModal(true);
                        } else {
                          // Navegar direto para o primeiro vídeo do card
                          const firstVideoId = card.videoIds?.[0] || card.videoId;
                          if (firstVideoId) {
                            navigate(`/videos/${firstVideoId}`);
                          }
                        }
                      };

                      return (
                        <div
                          key={card.uid}
                          className={`card ${isPaidContent && !hasAccess ? 'card--locked' : ''}`}
                          onClick={handleCardClick}
                        >
                          <div className="card-image-container">
                            {cardImageUrl ? (
                              <img 
                                src={cardImageUrl} 
                                alt={card.name}
                                className="card-image"
                                style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  console.error('Erro ao carregar imagem do card:', cardImageUrl, card.name);
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const placeholder = target.parentElement?.querySelector('.card-image-placeholder') as HTMLElement;
                                  if (placeholder) placeholder.style.display = 'flex';
                                }}
                                onLoad={() => {
                                  console.log('Imagem carregada:', cardImageUrl, card.name);
                                }}
                              />
                            ) : null}
                            <div 
                              className="card-image-placeholder"
                              style={{ display: cardImageUrl ? 'none' : 'flex' }}
                            >
                              <span className="card-icon">▶</span>
                            </div>
                            {isPaidContent && !hasAccess && (
                              <div className="card-lock-overlay">
                                <LockIcon className="card-lock-icon" />
                              </div>
                            )}
                          </div>
                          <div className="card-content">
                            <h3 className="card-title">{card.name}</h3>
                            <p className="card-subtitle">
                              {card.videoIds?.length || (card.videoId ? 1 : 0)} vídeo(s)
                            </p>
                            {isPaidContent && !hasAccess && (
                              <span className="card-paid-badge">Premium</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <PaidContentModal 
        isOpen={showPaidModal} 
        onClose={() => setShowPaidModal(false)} 
      />
    </div>
  );
};

export default Home;
