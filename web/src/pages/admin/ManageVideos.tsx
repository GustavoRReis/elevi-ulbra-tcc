import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Video } from '../../types';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import './ManageVideos.css';

const ManageVideos: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [editForm, setEditForm] = useState({ name: '', url: '' });
  const [showModal, setShowModal] = useState(false);
  const [modalVideoId, setModalVideoId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', url: '' });

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      const videosSnapshot = await getDocs(collection(db, 'videos'));
      const videosData = videosSnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as Video[];
      setVideos(videosData);
    } catch (err) {
      setError('Erro ao carregar vídeos');
      console.error('Error loading videos:', err);
    } finally {
      setLoading(false);
    }
  };

  const extractYouTubeId = (url: string): string | null => {
    const regExp = /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[1].length === 11) ? match[1] : null;
  };

  const getYouTubeThumbnail = (url: string): string | null => {
    const id = extractYouTubeId(url);
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
  };

  const isValidYouTubeUrl = (url: string): boolean => {
    return extractYouTubeId(url) !== null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVideo) {
        await updateDoc(doc(db, 'videos', editingVideo.uid), {
          name: editForm.name,
          url: editForm.url
        });
      } else {
        await addDoc(collection(db, 'videos'), {
          name: formData.name,
          url: formData.url,
          createdAt: new Date()
        });
      }
      setFormData({ name: '', url: '' });
      setEditForm({ name: '', url: '' });
      setShowForm(false);
      setEditingVideo(null);
      fetchVideos();
    } catch (error) {
      console.error('Erro ao salvar vídeo:', error);
      setError('Erro ao salvar vídeo');
    }
  };

  const handleEdit = (video: Video) => {
    setEditingVideo(video);
    setEditForm({ name: video.name, url: video.url });
    setShowForm(true);
  };

  const handleDelete = async (videoId: string, videoName: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o vídeo "${videoName}"?`)) return;
    
    try {
      await deleteDoc(doc(db, 'videos', videoId));
      fetchVideos();
    } catch (err) {
      setError('Erro ao excluir vídeo');
      console.error('Error deleting video:', err);
    }
  };

  const handleOpenModal = (video: Video) => {
    const id = extractYouTubeId(video.url);
    if (id) {
      setModalVideoId(id);
      setShowModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalVideoId(null);
  };

  const formatDate = (date: any) => {
    if (!date) return 'Data não disponível';
    const d = date.toDate ? date.toDate() : new Date(date);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  };

  if (loading) {
    return (
      <div className="video-management">
        <div className="loading">Carregando vídeos...</div>
      </div>
    );
  }

  return (
    <div className="video-management">
      <div className="video-management-header">
        <div>
          <h2>Gerenciar Vídeos</h2>
          <p>Administre os vídeos do sistema</p>
        </div>
        <button 
          onClick={() => { setShowForm(true); setEditingVideo(null); setFormData({ name: '', url: '' }); }} 
          className="btn-add-video"
        >
          <AddIcon /> Novo Vídeo
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="videos-list">
        {videos.length === 0 ? (
          <div className="no-videos">
            <VideoLibraryIcon className="no-videos-icon" />
            <p>Nenhum vídeo encontrado</p>
          </div>
        ) : (
          videos.map((video) => (
            <div key={video.uid} className="video-card">
              <div className="video-thumbnail" onClick={() => handleOpenModal(video)}>
                {getYouTubeThumbnail(video.url) ? (
                  <>
                    <img src={getYouTubeThumbnail(video.url)!} alt="Thumbnail" />
                    <div className="play-overlay">
                      <PlayArrowIcon />
                    </div>
                  </>
                ) : (
                  <div className="no-thumbnail">
                    <VideoLibraryIcon />
                  </div>
                )}
              </div>
              
              <div className="video-info">
                <h3 className="video-name">{video.name}</h3>
                <p className="video-description">{video.url}</p>
                <div className="video-details">
                  <p className="video-date">
                    Criado em: {formatDate(video.createdAt)}
                  </p>
                </div>
              </div>
              
              <div className="video-actions">
                <button
                  className="edit-btn"
                  onClick={() => handleEdit(video)}
                  title="Editar vídeo"
                >
                  <EditIcon />
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(video.uid, video.name)}
                  title="Excluir vídeo"
                >
                  <DeleteIcon />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Edição */}
      {showForm && (
        <div className="edit-modal-overlay">
          <div className="edit-modal">
            <div className="edit-modal-header">
              <h3>{editingVideo ? 'Editar' : 'Novo'} Vídeo</h3>
              <button className="close-btn" onClick={() => { setShowForm(false); setEditingVideo(null); setFormData({ name: '', url: '' }); setEditForm({ name: '', url: '' }); }}>
                <CloseIcon />
              </button>
            </div>
            <div className="edit-modal-content">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Título:</label>
                  <input
                    type="text"
                    value={editingVideo ? editForm.name : formData.name}
                    onChange={(e) => editingVideo 
                      ? setEditForm({ ...editForm, name: e.target.value })
                      : setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>URL do YouTube:</label>
                  <input
                    type="text"
                    value={editingVideo ? editForm.url : formData.url}
                    onChange={(e) => editingVideo
                      ? setEditForm({ ...editForm, url: e.target.value })
                      : setFormData({ ...formData, url: e.target.value })
                    }
                    required
                  />
                  {(editingVideo ? editForm.url : formData.url) && getYouTubeThumbnail(editingVideo ? editForm.url : formData.url) && (
                    <div className="thumbnail-preview">
                      <img src={getYouTubeThumbnail(editingVideo ? editForm.url : formData.url)!} alt="Preview" />
                      <span>Preview da thumbnail</span>
                    </div>
                  )}
                </div>
                <div className="edit-modal-actions">
                  <button type="button" className="cancel-btn" onClick={() => { setShowForm(false); setEditingVideo(null); setFormData({ name: '', url: '' }); setEditForm({ name: '', url: '' }); }}>
                    Cancelar
                  </button>
                  <button type="submit" className="save-btn">
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualização do Vídeo */}
      {showModal && modalVideoId && (
        <div className="video-modal-overlay" onClick={handleCloseModal}>
          <div className="video-modal" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={handleCloseModal}>
              <CloseIcon />
            </button>
            <div className="video-modal-content">
              <iframe
                width="100%"
                height="315"
                src={`https://www.youtube.com/embed/${modalVideoId}?autoplay=1`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageVideos;
