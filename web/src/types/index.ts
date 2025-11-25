export interface User {
  uid: string;
  name: string;
  email: string;
  createdAt: any; // Firestore timestamp
  isAdmin: boolean;
  planType?: string;
  idPlan?: string;
  planActive?: boolean;
  planStartedAt?: any; // Firestore timestamp
  planEndDate?: any; // Firestore timestamp
}

export interface Plan {
  uid: string;
  name: string;
  monthlyPrice: number; // Valor parcelado (mensal)
  totalPrice: number; // Valor total
  period: string; // Período do plano (ex: "1 mês", "3 meses", "12 meses")
  periodMonths: number; // Número de meses do plano
  description?: string;
  createdAt: any; // Firestore timestamp
  isActive: boolean;
}

export interface UserPlan {
  id: string;
  userId: string;
  planId: string;
  status: string;
  startedAt: any; // Firestore timestamp
  endDate: any; // Firestore timestamp
  paymentId?: string;
}

export interface Course {
  uid: string;
  name: string;
  description: string;
  createdAt: any; // Firestore timestamp
  category: string;
}

export interface Card {
  uid: string;
  name: string;
  imageUrl: string; // URL da imagem do card (obrigatório)
  videoIds: string[]; // Array de IDs de vídeos (múltiplos vídeos por card)
  videoNames?: string[]; // Nomes dos vídeos (opcional, para compatibilidade)
  videoUrls?: string[]; // URLs dos vídeos (opcional, para compatibilidade)
  isFree?: boolean; // true = gratuito, false ou undefined = pago
  // Campos legados para compatibilidade (serão removidos gradualmente)
  videoId?: string; // DEPRECATED: usar videoIds[0]
  nameVideo?: string; // DEPRECATED
  urlVideo?: string; // DEPRECATED
}

export interface Video {
  uid: string;
  name: string;
  createdAt: any; // Firestore timestamp
  url: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: any;
  userId?: string; // Se null, é para todos os usuários
}

