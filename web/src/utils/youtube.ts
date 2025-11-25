/**
 * Extrai o ID do vídeo do YouTube a partir de uma URL
 */
export const extractYouTubeId = (url: string): string | null => {
  if (!url) return null;
  
  const regExp = /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[1].length === 11) ? match[1] : null;
};

/**
 * Gera a URL do thumbnail do YouTube a partir da URL do vídeo
 */
export const getYouTubeThumbnail = (url: string): string | null => {
  const id = extractYouTubeId(url);
  if (!id) return null;
  
  // Retorna a thumbnail de alta qualidade
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
};

/**
 * Gera a URL do thumbnail do YouTube a partir do ID do vídeo
 */
export const getYouTubeThumbnailById = (videoId: string): string => {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};

