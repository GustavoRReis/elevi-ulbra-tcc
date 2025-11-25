import React, { useEffect, useState } from 'react';
import { collection, getDocs, getDoc, addDoc, deleteDoc, doc, updateDoc, getDocs as getCardsDocs, addDoc as addCardDoc, deleteDoc as deleteCardDoc, updateDoc as updateCardDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Course, Card, Video } from '../../types';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import './ManageCourses.css';

interface CourseWithCards extends Course {
  cards: CardWithVideos[];
}

interface CardWithVideos extends Card {
  videos: Video[];
}

const ManageCourses: React.FC = () => {
  const [coursesWithCards, setCoursesWithCards] = useState<CourseWithCards[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [editingCard, setEditingCard] = useState<{ courseId: string; card: Card } | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', category: '' });
  const [cardFormData, setCardFormData] = useState({ 
    name: '', 
    imageUrl: '',
    videoIds: [] as string[], 
    isFree: true 
  });
  const [videos, setVideos] = useState<Video[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      await Promise.all([fetchCourses(), fetchVideos()]);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const coursesSnapshot = await getDocs(collection(db, 'courses'));
      const coursesData = await Promise.all(
        coursesSnapshot.docs.map(async (courseDoc) => {
          const course = { uid: courseDoc.id, ...courseDoc.data() } as Course;
          
          // Buscar cards do curso
          const cardsSnapshot = await getCardsDocs(collection(db, 'courses', courseDoc.id, 'cards'));
          const cardsWithVideos = await Promise.all(
            cardsSnapshot.docs.map(async (cardDoc) => {
              const card = { uid: cardDoc.id, ...cardDoc.data() } as Card;
              
              // Buscar vídeos do card
              const videoIds = card.videoIds || (card.videoId ? [card.videoId] : []);
              const cardVideos: Video[] = [];
              
              for (const videoId of videoIds) {
                try {
                  const videoDoc = await getDoc(doc(db, 'videos', videoId));
                  if (videoDoc.exists()) {
                    cardVideos.push({ uid: videoDoc.id, ...videoDoc.data() } as Video);
                  }
                } catch (error) {
                  console.error(`Erro ao buscar vídeo ${videoId}:`, error);
                }
              }
              
              return { ...card, videos: cardVideos };
            })
          );
          
          return { ...course, cards: cardsWithVideos };
        })
      );
      
      setCoursesWithCards(coursesData);
    } catch (error) {
      console.error('Erro ao buscar cursos:', error);
    }
  };

  const fetchVideos = async () => {
    try {
      const videosSnapshot = await getDocs(collection(db, 'videos'));
      setVideos(videosSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as Video)));
    } catch (error) {
      console.error('Erro ao buscar vídeos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await updateDoc(doc(db, 'courses', editingCourse.uid), {
          name: formData.name,
          description: formData.description,
          category: formData.category
        });
      } else {
        await addDoc(collection(db, 'courses'), {
          name: formData.name,
          description: formData.description,
          category: formData.category,
          createdAt: new Date()
        });
      }
      setFormData({ name: '', description: '', category: '' });
      setShowForm(false);
      setEditingCourse(null);
      fetchCourses();
    } catch (error) {
      console.error('Erro ao salvar curso:', error);
      alert('Erro ao salvar curso');
    }
  };

  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse && !editingCard) return;

    if (cardFormData.videoIds.length === 0) {
      alert('Selecione pelo menos um vídeo para o card.');
      return;
    }

    try {
      const courseId = editingCard ? editingCard.courseId : selectedCourse;
      if (!courseId) return;

      if (editingCard) {
        // Editar card existente
        await updateCardDoc(doc(db, 'courses', courseId, 'cards', editingCard.card.uid), {
          name: cardFormData.name,
          imageUrl: cardFormData.imageUrl,
          videoIds: cardFormData.videoIds,
          isFree: cardFormData.isFree
        });
      } else {
        // Criar novo card
        await addCardDoc(collection(db, 'courses', courseId, 'cards'), {
          name: cardFormData.name,
          imageUrl: cardFormData.imageUrl,
          videoIds: cardFormData.videoIds,
          isFree: cardFormData.isFree
        });
      }
      
      setCardFormData({ name: '', imageUrl: '', videoIds: [], isFree: true });
      setShowCardForm(false);
      setSelectedCourse(null);
      setEditingCard(null);
      fetchCourses();
    } catch (error) {
      console.error('Erro ao salvar card:', error);
      alert('Erro ao salvar card');
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este curso? Todos os cards serão excluídos também.')) return;
    
    try {
      const cardsSnapshot = await getCardsDocs(collection(db, 'courses', courseId, 'cards'));
      for (const cardDoc of cardsSnapshot.docs) {
        await deleteCardDoc(doc(db, 'courses', courseId, 'cards', cardDoc.id));
      }
      await deleteDoc(doc(db, 'courses', courseId));
      fetchCourses();
    } catch (error) {
      console.error('Erro ao excluir curso:', error);
      alert('Erro ao excluir curso');
    }
  };

  const handleDeleteCard = async (courseId: string, cardId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este card?')) return;
    
    try {
      await deleteCardDoc(doc(db, 'courses', courseId, 'cards', cardId));
      fetchCourses();
    } catch (error) {
      console.error('Erro ao excluir card:', error);
      alert('Erro ao excluir card');
    }
  };

  const toggleCourseExpansion = (courseId: string) => {
    const newExpanded = new Set(expandedCourses);
    if (newExpanded.has(courseId)) {
      newExpanded.delete(courseId);
    } else {
      newExpanded.add(courseId);
    }
    setExpandedCourses(newExpanded);
  };

  const handleEditCard = (courseId: string, card: Card) => {
    setEditingCard({ courseId, card });
    setCardFormData({
      name: card.name,
      imageUrl: card.imageUrl || '',
      videoIds: card.videoIds || (card.videoId ? [card.videoId] : []),
      isFree: card.isFree !== false
    });
    setShowCardForm(true);
  };

  const handleAddCard = (courseId: string) => {
    setSelectedCourse(courseId);
    setEditingCard(null);
    setCardFormData({ name: '', imageUrl: '', videoIds: [], isFree: true });
    setShowCardForm(true);
  };

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div className="course-management">
      <div className="course-management-header">
        <div>
          <h2>Gerenciar Cursos</h2>
          <p>Administre cursos, cards e vídeos do sistema</p>
        </div>
        <button 
          onClick={() => { 
            setShowForm(true); 
            setEditingCourse(null); 
            setFormData({ name: '', description: '', category: '' }); 
          }} 
          className="btn-add-course"
        >
          <AddIcon /> Novo Curso
        </button>
      </div>

      {/* Modal de Curso */}
      {showForm && (
        <div className="form-modal">
          <div className="form-content">
            <h2>{editingCourse ? 'Editar' : 'Novo'} Curso</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nome do Curso</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Descrição</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required rows={4}></textarea>
              </div>
              <div className="form-group">
                <label>Categoria</label>
                <input type="text" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">Salvar</button>
                <button type="button" onClick={() => { setShowForm(false); setEditingCourse(null); }} className="btn-secondary">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Card */}
      {showCardForm && (
        <div className="form-modal">
          <div className="form-content">
            <h2>{editingCard ? 'Editar' : 'Adicionar'} Card</h2>
            <form onSubmit={handleCardSubmit}>
              <div className="form-group">
                <label>Nome do Card</label>
                <input 
                  type="text" 
                  value={cardFormData.name} 
                  onChange={(e) => setCardFormData({ ...cardFormData, name: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>URL da Imagem do Card *</label>
                <input 
                  type="url" 
                  value={cardFormData.imageUrl} 
                  onChange={(e) => setCardFormData({ ...cardFormData, imageUrl: e.target.value })} 
                  required 
                  placeholder="https://exemplo.com/imagem.jpg"
                />
                <small style={{ color: 'var(--primary-color)', opacity: 0.7, fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  A imagem é obrigatória. Use uma URL válida de imagem (recomendado: 560x760px ou 1120x1520px)
                </small>
                {cardFormData.imageUrl && (
                  <div style={{ marginTop: '12px' }}>
                    <img 
                      src={cardFormData.imageUrl} 
                      alt="Preview" 
                      style={{ 
                        maxWidth: '200px', 
                        maxHeight: '200px', 
                        borderRadius: '8px', 
                        border: '2px solid var(--primary-color)',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Vídeos (selecione um ou mais)</label>
                <div style={{ 
                  border: '1px solid var(--primary-color-light)', 
                  borderRadius: '8px', 
                  padding: '12px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  backgroundColor: 'var(--secondary-color)'
                }}>
                  {videos.length === 0 ? (
                    <p style={{ color: 'var(--primary-color)', opacity: 0.7 }}>
                      Nenhum vídeo cadastrado. Cadastre vídeos primeiro em "Gerenciar Vídeos".
                    </p>
                  ) : (
                    videos.map(video => (
                      <label 
                        key={video.uid}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '12px', 
                          cursor: 'pointer',
                          padding: '10px',
                          borderRadius: '6px',
                          marginBottom: '6px',
                          transition: 'background-color 0.2s',
                          backgroundColor: cardFormData.videoIds.includes(video.uid) ? 'var(--primary-color-light)' : 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          if (!cardFormData.videoIds.includes(video.uid)) {
                            e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!cardFormData.videoIds.includes(video.uid)) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={cardFormData.videoIds.includes(video.uid)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCardFormData({
                                ...cardFormData,
                                videoIds: [...cardFormData.videoIds, video.uid]
                              });
                            } else {
                              setCardFormData({
                                ...cardFormData,
                                videoIds: cardFormData.videoIds.filter(id => id !== video.uid)
                              });
                            }
                          }}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <VideoLibraryIcon style={{ fontSize: '20px', color: 'var(--primary-color)' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500 }}>{video.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--primary-color)', opacity: 0.7 }}>
                            {video.url ? (video.url.length > 50 ? video.url.substring(0, 50) + '...' : video.url) : 'Sem URL'}
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
                <small style={{ color: 'var(--primary-color)', opacity: 0.7, fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  {cardFormData.videoIds.length} vídeo(s) selecionado(s)
                </small>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={cardFormData.isFree}
                    onChange={(e) => setCardFormData({ ...cardFormData, isFree: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span>Conteúdo Gratuito</span>
                </label>
                <small style={{ color: 'var(--primary-color)', opacity: 0.7, fontSize: '12px', marginTop: '4px', display: 'block', marginLeft: '26px' }}>
                  {cardFormData.isFree 
                    ? 'Este conteúdo será acessível a todos os usuários' 
                    : 'Este conteúdo exigirá plano ativo para acesso'}
                </small>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">Salvar</button>
                <button 
                  type="button" 
                  onClick={() => { 
                    setShowCardForm(false); 
                    setSelectedCourse(null); 
                    setEditingCard(null);
                    setCardFormData({ name: '', imageUrl: '', videoIds: [], isFree: true }); 
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

      {/* Lista de Cursos */}
      <div className="courses-list">
        {coursesWithCards.length === 0 ? (
          <div className="empty-state">Nenhum curso cadastrado</div>
        ) : (
          coursesWithCards.map((course) => {
            const isExpanded = expandedCourses.has(course.uid);
            
            return (
              <div key={course.uid} className="course-item-expanded">
                <div className="course-header-expanded">
                  <div className="course-info-expanded">
                    <div className="course-details">
                      <h3>{course.name}</h3>
                      <p>{course.description}</p>
                      <div className="course-meta">
                        <span className="course-category">{course.category}</span>
                        <span className="course-cards-count">
                          {course.cards.length} card(s) • {course.cards.reduce((acc, card) => acc + card.videos.length, 0)} vídeo(s)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="course-actions-expanded">
                    <button 
                      onClick={() => toggleCourseExpansion(course.uid)}
                      className="btn-expand"
                      title={isExpanded ? 'Recolher' : 'Expandir'}
                    >
                      {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </button>
                    <button 
                    onClick={() => { 
                      setEditingCourse(course); 
                      setFormData({ 
                        name: course.name, 
                        description: course.description, 
                        category: course.category
                      }); 
                      setShowForm(true); 
                    }}
                      className="btn-edit"
                    >
                      <EditIcon /> Editar
                    </button>
                    <button 
                      onClick={() => handleAddCard(course.uid)} 
                      className="btn-add-card"
                    >
                      <AddIcon /> Adicionar Card
                    </button>
                    <button 
                      onClick={() => handleDeleteCourse(course.uid)} 
                      className="btn-delete"
                    >
                      <DeleteIcon /> Excluir
                    </button>
                  </div>
                </div>

                {/* Cards do Curso (expandido) */}
                {isExpanded && (
                  <div className="cards-list-expanded">
                    {course.cards.length === 0 ? (
                      <div className="empty-state-cards">
                        <p>Nenhum card cadastrado neste curso.</p>
                        <button 
                          onClick={() => handleAddCard(course.uid)}
                          className="btn-add-card-small"
                        >
                          <AddIcon /> Adicionar Primeiro Card
                        </button>
                      </div>
                    ) : (
                      course.cards.map((card) => (
                        <div key={card.uid} className="card-item-expanded">
                          <div className="card-header-expanded">
                            <div className="card-info-expanded">
                              {card.imageUrl && (
                                <img 
                                  src={card.imageUrl} 
                                  alt={card.name}
                                  style={{ 
                                    width: '80px', 
                                    height: '80px', 
                                    objectFit: 'cover', 
                                    borderRadius: '8px',
                                    marginRight: '12px'
                                  }}
                                />
                              )}
                              <div style={{ flex: 1 }}>
                                <div className="card-title-row">
                                  <h4>{card.name}</h4>
                                  <div className="card-badges">
                                    {card.isFree === false ? (
                                      <span className="badge-paid">
                                        <LockIcon style={{ fontSize: '14px' }} /> Premium
                                      </span>
                                    ) : (
                                      <span className="badge-free">
                                        <LockOpenIcon style={{ fontSize: '14px' }} /> Gratuito
                                      </span>
                                    )}
                                    <span className="badge-videos">
                                      <VideoLibraryIcon style={{ fontSize: '14px' }} /> {card.videos.length} vídeo(s)
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="card-actions-expanded">
                              <button 
                                onClick={() => handleEditCard(course.uid, card)}
                                className="btn-edit-small"
                              >
                                <EditIcon /> Editar
                              </button>
                              <button 
                                onClick={() => handleDeleteCard(course.uid, card.uid)}
                                className="btn-delete-small"
                              >
                                <DeleteIcon /> Excluir
                              </button>
                            </div>
                          </div>

                          {/* Vídeos do Card */}
                          {card.videos.length > 0 && (
                            <div className="videos-list-expanded">
                              <h5>Vídeos deste Card:</h5>
                              <div className="videos-grid-expanded">
                                {card.videos.map((video) => (
                                  <div key={video.uid} className="video-item-expanded">
                                    <VideoLibraryIcon style={{ fontSize: '24px', color: 'var(--primary-color)' }} />
                                    <div className="video-info-expanded">
                                      <div className="video-name">{video.name}</div>
                                      <div className="video-url">
                                        {video.url ? (
                                          <a href={video.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', fontSize: '12px' }}>
                                            {video.url.length > 60 ? video.url.substring(0, 60) + '...' : video.url}
                                          </a>
                                        ) : (
                                          <span style={{ color: 'var(--primary-color)', opacity: 0.5, fontSize: '12px' }}>Sem URL</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ManageCourses;
