import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Course, Card, Video } from '../types';
import { getYouTubeThumbnail } from '../utils/youtube';
import { useCustomization } from '../context/CustomizationContext';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import LockIcon from '@mui/icons-material/Lock';
import PaidContentModal from '../components/PaidContentModal';
import './Courses.css';

interface VideoWithCard extends Video {
  cardId: string;
  cardName: string;
  isFree?: boolean;
}

const Courses: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [searchParams] = useSearchParams();
  const cardId = searchParams.get('card');
  const navigate = useNavigate();
  const { customization } = useCustomization();
  const { userData } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [videos, setVideos] = useState<VideoWithCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaidModal, setShowPaidModal] = useState(false);

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId) return;

      try {
        const courseDoc = await getDoc(doc(db, 'courses', courseId));
        if (courseDoc.exists()) {
          setCourse({ uid: courseDoc.id, ...courseDoc.data() } as Course);
        }

        const cardsSnapshot = await getDocs(collection(db, 'courses', courseId, 'cards'));
        const cardsData = cardsSnapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        })) as Card[];
        setCards(cardsData);

        // Se há um cardId na URL, buscar apenas os vídeos daquele card
        if (cardId) {
          const selectedCard = cardsData.find(c => c.uid === cardId);
          if (selectedCard) {
            const videoIds = selectedCard.videoIds || (selectedCard.videoId ? [selectedCard.videoId] : []);
            const videosData: VideoWithCard[] = [];
            
            for (const videoId of videoIds) {
              try {
                const videoDoc = await getDoc(doc(db, 'videos', videoId));
                if (videoDoc.exists()) {
                  const videoData = videoDoc.data() as Video;
                  videosData.push({
                    ...videoData,
                    uid: videoDoc.id,
                    cardId: selectedCard.uid,
                    cardName: selectedCard.name,
                    isFree: selectedCard.isFree
                  });
                }
              } catch (error) {
                console.error(`Erro ao buscar vídeo ${videoId}:`, error);
              }
            }
            
            setVideos(videosData);
          }
        } else {
          // Se não há cardId, mostrar todos os cards
          setVideos([]);
        }
      } catch (error) {
        console.error('Erro ao buscar dados do curso:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId, cardId, userData]);

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  if (!course) {
    return <div className="error">Curso não encontrado</div>;
  }

  return (
    <div className="courses-page">
      <header className="headerHome headerHome--solid">
        <div className="left">
          <Logo />
        </div>
        <div className="right">
          <button onClick={() => navigate('/')} className="btn-back-header">
            ← Voltar
          </button>
        </div>
      </header>
      
      <main className="courses-main">
        <div className="course-header">
          <h1>{course.name}</h1>
          <p className="course-description">{course.description}</p>
          <span className="course-category">{course.category}</span>
        </div>

        {cardId ? (
          // Mostrar vídeos do card selecionado
          <div className="videos-section">
            <h2>
              {videos.length > 0 && videos[0].cardName}
            </h2>
            {videos.length === 0 ? (
              <div className="empty-state">
                <p>Nenhum vídeo disponível neste card.</p>
              </div>
            ) : (
              <div className="cards-grid-horizontal">
                {videos.map((video) => {
                  // Usar a imagem do card atual (se disponível) ou thumbnail do vídeo
                  const currentCard = cards.find(c => c.uid === cardId);
                  const cardImageUrl = currentCard?.imageUrl;
                  const thumbnailUrl = cardImageUrl || (video.url ? getYouTubeThumbnail(video.url) : null);
                  const isPaidContent = video.isFree === false;
                  const hasAccess = userData?.isAdmin || userData?.planActive === true || video.isFree === true;

                  const handleVideoClick = () => {
                    if (isPaidContent && !hasAccess) {
                      setShowPaidModal(true);
                    } else {
                      navigate(`/videos/${video.uid}`);
                    }
                  };

                  return (
                    <div
                      key={video.uid}
                      className={`card-course ${isPaidContent && !hasAccess ? 'card-course--locked' : ''}`}
                      onClick={handleVideoClick}
                    >
                      <div className="card-image-container-course">
                        {thumbnailUrl ? (
                          <img 
                            src={thumbnailUrl} 
                            alt={video.name}
                            className="card-thumbnail-course"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const placeholder = target.nextElementSibling as HTMLElement;
                              if (placeholder) placeholder.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="card-image-placeholder-course"
                          style={{ display: thumbnailUrl ? 'none' : 'flex' }}
                        >
                          <span className="card-icon-course">▶</span>
                        </div>
                        {isPaidContent && !hasAccess && (
                          <div className="card-lock-overlay">
                            <LockIcon className="card-lock-icon" />
                          </div>
                        )}
                      </div>
                      <div className="card-content-course">
                        <h3 className="card-title-course">{video.name}</h3>
                        {isPaidContent && !hasAccess && (
                          <span className="card-paid-badge">Conteúdo Premium</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          // Mostrar todos os cards do curso
          <div className="cards-section">
            <h2>Cards do Curso</h2>
            {cards.length === 0 ? (
              <div className="empty-state">
                <p>Nenhum card disponível neste curso.</p>
              </div>
            ) : (
              <div className="cards-grid-horizontal">
                {cards.map((card) => {
                  // Usar a imagem do card
                  const cardImageUrl = card.imageUrl;
                  const isPaidContent = card.isFree === false;
                  const hasAccess = userData?.isAdmin || userData?.planActive === true || card.isFree === true;

                  const handleCardClick = () => {
                    if (isPaidContent && !hasAccess) {
                      setShowPaidModal(true);
                    } else {
                      navigate(`/courses/${courseId}?card=${card.uid}`);
                    }
                  };

                  return (
                    <div
                      key={card.uid}
                      className={`card-course ${isPaidContent && !hasAccess ? 'card-course--locked' : ''}`}
                      onClick={handleCardClick}
                    >
                    <div className="card-image-container-course">
                      {cardImageUrl ? (
                        <img 
                          src={cardImageUrl} 
                          alt={card.name}
                          className="card-thumbnail-course"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const placeholder = target.nextElementSibling as HTMLElement;
                            if (placeholder) placeholder.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="card-image-placeholder-course"
                        style={{ display: cardImageUrl ? 'none' : 'flex' }}
                      >
                        <span className="card-icon-course">▶</span>
                      </div>
                        {isPaidContent && !hasAccess && (
                          <div className="card-lock-overlay">
                            <LockIcon className="card-lock-icon" />
                          </div>
                        )}
                      </div>
                      <div className="card-content-course">
                        <h3 className="card-title-course">{card.name}</h3>
                        <p className="card-subtitle-course">
                          {card.videoIds?.length || (card.videoId ? 1 : 0)} vídeo(s)
                        </p>
                        {isPaidContent && !hasAccess && (
                          <span className="card-paid-badge">Conteúdo Premium</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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

export default Courses;
