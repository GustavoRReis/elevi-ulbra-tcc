import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, where, addDoc, deleteDoc, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Video, Card } from '../types';
import { getYouTubeThumbnail } from '../utils/youtube';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import LockIcon from '@mui/icons-material/Lock';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import CommentIcon from '@mui/icons-material/Comment';
import PaidContentModal from '../components/PaidContentModal';
import './Videos.css';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: Timestamp;
}

const Videos: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [video, setVideo] = useState<Video | null>(null);
  const [cardVideos, setCardVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [currentCourseId, setCurrentCourseId] = useState<string | null>(null);
  const [showPaidModal, setShowPaidModal] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [videoHeight, setVideoHeight] = useState(0);

  useEffect(() => {
    const fetchVideo = async () => {
      if (!videoId) return;

      try {
        // Buscar o vídeo atual
        const videoDoc = await getDoc(doc(db, 'videos', videoId));
        if (!videoDoc.exists()) {
          setLoading(false);
          return;
        }
        setVideo({ uid: videoDoc.id, ...videoDoc.data() } as Video);

        // Buscar o card que contém este vídeo
        const coursesSnapshot = await getDocs(collection(db, 'courses'));
        for (const courseDoc of coursesSnapshot.docs) {
          const cardsSnapshot = await getDocs(collection(db, 'courses', courseDoc.id, 'cards'));
          
          // Procurar card que contém o vídeo atual (suporta videoIds array e videoId legado)
          const cardDoc = cardsSnapshot.docs.find(c => {
            const cardData = c.data();
            return cardData.videoIds?.includes(videoId) || cardData.videoId === videoId;
          });

          if (cardDoc) {
            const cardData = { uid: cardDoc.id, ...cardDoc.data() } as Card;
            setCurrentCard(cardData);
            setCurrentCourseId(courseDoc.id);
            
            // Buscar todos os vídeos do card
            const videoIds = cardData.videoIds || (cardData.videoId ? [cardData.videoId] : []);
            const videosData: Video[] = [];
            
            for (const vidId of videoIds) {
              try {
                const vidDoc = await getDoc(doc(db, 'videos', vidId));
                if (vidDoc.exists()) {
                  videosData.push({
                    uid: vidDoc.id,
                    ...vidDoc.data()
                  } as Video);
                }
              } catch (error) {
                console.error(`Erro ao buscar vídeo ${vidId}:`, error);
              }
            }
            
            setCardVideos(videosData);
            
            // Verificar se o card atual é pago
            const isPaidContent = cardData.isFree === false;
            const hasAccess = userData?.isAdmin || userData?.planActive === true || cardData.isFree === true;
            
            if (isPaidContent && !hasAccess) {
              setShowPaidModal(true);
            }
            
            break;
          }
        }
      } catch (error) {
        console.error('Erro ao buscar vídeo:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [videoId, userData]);

  // Buscar likes e verificar se usuário curtiu
  useEffect(() => {
    if (!videoId || !userData) return;

    // Verificar se usuário curtiu
    const checkLike = async () => {
      try {
        const likesQuery = query(
          collection(db, 'videoLikes'),
          where('videoId', '==', videoId),
          where('userId', '==', userData.uid)
        );
        const likesSnapshot = await getDocs(likesQuery);
        setLiked(!likesSnapshot.empty);
      } catch (error) {
        console.error('Erro ao verificar like:', error);
      }
    };

    // Contar likes
    const countLikes = async () => {
      try {
        const likesQuery = query(
          collection(db, 'videoLikes'),
          where('videoId', '==', videoId)
        );
        const likesSnapshot = await getDocs(likesQuery);
        setLikesCount(likesSnapshot.size);
      } catch (error) {
        console.error('Erro ao contar likes:', error);
      }
    };

    checkLike();
    countLikes();

    // Escutar mudanças em tempo real
    const unsubscribeLikes = onSnapshot(
      query(collection(db, 'videoLikes'), where('videoId', '==', videoId)),
      (snapshot) => {
        setLikesCount(snapshot.size);
        if (userData) {
          const userLike = snapshot.docs.find(doc => doc.data().userId === userData.uid);
          setLiked(!!userLike);
        }
      }
    );

    return () => unsubscribeLikes();
  }, [videoId, userData]);

  // Buscar comentários da subcoleção do card filtrados pelo vídeo atual
  useEffect(() => {
    if (!currentCard || !currentCourseId || !videoId) return;

    const unsubscribeComments = onSnapshot(
      query(
        collection(db, 'courses', currentCourseId, 'cards', currentCard.uid, 'comments'),
        where('videoId', '==', videoId),
        orderBy('createdAt', 'desc')
      ),
      (snapshot) => {
        const commentsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Comment[];
        setComments(commentsData);
      },
      (error) => {
        console.error('Erro ao buscar comentários:', error);
      }
    );

    return () => unsubscribeComments();
  }, [currentCard, currentCourseId, videoId]);

  const handleLike = async () => {
    if (!videoId || !userData) return;

    try {
      if (liked) {
        // Remover like
        const likesQuery = query(
          collection(db, 'videoLikes'),
          where('videoId', '==', videoId),
          where('userId', '==', userData.uid)
        );
        const likesSnapshot = await getDocs(likesQuery);
        for (const likeDoc of likesSnapshot.docs) {
          await deleteDoc(doc(db, 'videoLikes', likeDoc.id));
        }
      } else {
        // Adicionar like
        await addDoc(collection(db, 'videoLikes'), {
          videoId,
          userId: userData.uid,
          createdAt: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('Erro ao curtir vídeo:', error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCard || !currentCourseId || !userData || !commentText.trim()) return;

    setSubmittingComment(true);
    try {
      await addDoc(
        collection(db, 'courses', currentCourseId, 'cards', currentCard.uid, 'comments'),
        {
          videoId,
          userId: userData.uid,
          userName: userData.name,
          text: commentText.trim(),
          createdAt: Timestamp.now()
        }
      );
      setCommentText('');
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'agora';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min atrás`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} h atrás`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} dias atrás`;
    
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Converter URL para embed do YouTube
  const getEmbedUrl = (url: string): string => {
    const regExp = /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const id = (match && match[1].length === 11) ? match[1] : null;
    return id ? `https://www.youtube.com/embed/${id}` : url;
  };

  // Calcular altura do vídeo para alinhar o container do título
  useEffect(() => {
    const updateVideoHeight = () => {
      const videoWrapper = document.querySelector('.videoWrapper');
      if (videoWrapper) {
        const height = videoWrapper.clientHeight;
        setVideoHeight(height);
      }
    };

    updateVideoHeight();
    window.addEventListener('resize', updateVideoHeight);
    return () => window.removeEventListener('resize', updateVideoHeight);
  }, [video]);

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  if (!video) {
    return <div className="error">Vídeo não encontrado</div>;
  }

  return (
    <div className="container">
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

      <div className="content">
        <div className="videoArea">
          {currentCard && (() => {
            // Conteúdo é pago apenas se isFree for explicitamente false
            const isPaidContent = currentCard.isFree === false;
            // Usuário tem acesso se for admin, tiver plano ativo, ou se o conteúdo for gratuito
            const hasAccess = userData?.isAdmin || userData?.planActive === true || currentCard.isFree === true;
            return isPaidContent && !hasAccess;
          })() ? (
            <div className="video-locked">
              <LockIcon style={{ fontSize: '80px', color: 'var(--primary-color)', marginBottom: '24px' }} />
              <h2 className="videoTitle">Conteúdo Exclusivo</h2>
              <p style={{ color: 'var(--primary-color)', opacity: 0.7, marginBottom: '24px', textAlign: 'center' }}>
                Este vídeo faz parte de um plano premium. Assine um plano para ter acesso completo.
              </p>
              <button 
                onClick={() => navigate('/plans')}
                className="btn-go-to-plans-video"
              >
                Ver Planos Disponíveis
              </button>
            </div>
          ) : (
            <>
              <div className="videoWrapper">
                <iframe
                  className="video"
                  src={getEmbedUrl(video.url)}
                  title={video.name}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              
              <div className="videoTitleContainer" style={{ height: videoHeight > 0 ? `${videoHeight}px` : 'auto' }}>
                <h2 className="videoTitle">{video.name}</h2>
                <div className="videoActions">
                  <button
                    className={`videoActionButton ${liked ? 'active' : ''}`}
                    onClick={handleLike}
                    disabled={!userData}
                  >
                    <ThumbUpIcon />
                    <span>{likesCount}</span>
                  </button>
                  <button className="videoActionButton" disabled>
                    <CommentIcon />
                    <span>{comments.length}</span>
                  </button>
                </div>
              </div>

              <div className="commentsSection">
                <h3 className="commentsTitle">Comentários</h3>
                
                {userData && (
                  <form className="commentForm" onSubmit={handleSubmitComment}>
                    <textarea
                      className="commentInput"
                      placeholder="Adicione um comentário..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      rows={3}
                    />
                    <button
                      type="submit"
                      className="commentSubmitButton"
                      disabled={!commentText.trim() || submittingComment}
                    >
                      {submittingComment ? 'Enviando...' : 'Comentar'}
                    </button>
                  </form>
                )}

                <div className="commentsList">
                  {comments.length === 0 ? (
                    <p style={{ color: 'rgba(0, 0, 0, 0.5)', fontStyle: 'italic' }}>
                      Nenhum comentário ainda. Seja o primeiro a comentar!
                    </p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="commentItem">
                        <div className="commentHeader">
                          <span className="commentAuthor">{comment.userName}</span>
                          <span className="commentDate">{formatDate(comment.createdAt)}</span>
                        </div>
                        <p className="commentText">{comment.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {cardVideos.length > 0 && currentCard && (
          <aside className="sidebar">
            <h3 className="sidebarTitle">{currentCard.name}</h3>
            <div className="lessonList">
              {cardVideos.map((vid) => {
                const thumbnailUrl = vid.url ? getYouTubeThumbnail(vid.url) : null;
                const isPaidContent = currentCard.isFree === false;
                const hasAccess = userData?.isAdmin || userData?.planActive === true || currentCard.isFree === true;

                const handleVideoClick = () => {
                  if (isPaidContent && !hasAccess) {
                    setShowPaidModal(true);
                  } else {
                    navigate(`/videos/${vid.uid}`);
                  }
                };

                const isActive = videoId === vid.uid;

                return (
                  <div 
                    key={vid.uid} 
                    className={`lessonItem ${isActive ? 'active' : ''} ${isPaidContent && !hasAccess ? 'lessonItem--locked' : ''}`}
                    onClick={handleVideoClick}
                  >
                    {thumbnailUrl && (
                      <img 
                        src={thumbnailUrl} 
                        alt={vid.name}
                        className="lessonThumbnail"
                      />
                    )}
                    {isPaidContent && !hasAccess && (
                      <div className="lesson-lock-icon">
                        <LockIcon style={{ fontSize: '16px' }} />
                      </div>
                    )}
                    <div className="lessonInfo">
                      <p className="lessonTitle">{vid.name}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        )}
      </div>
      <PaidContentModal 
        isOpen={showPaidModal} 
        onClose={() => setShowPaidModal(false)} 
      />
    </div>
  );
};

export default Videos;
