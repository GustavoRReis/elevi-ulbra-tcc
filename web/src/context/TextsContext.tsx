import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

interface TextsData {
  bannerTitle: string;
  bannerSubtitle: string;
  bannerButtonText: string;
  homeSectionTitle: string;
  homeSectionSubtitle: string;
  homeEmptyState: string;
}

interface TextsContextType {
  texts: TextsData;
  loading: boolean;
  updateTexts: (data: Partial<TextsData>) => Promise<void>;
}

const defaultTexts: TextsData = {
  bannerTitle: 'Bem-vindo ao {companyName}',
  bannerSubtitle: 'Transforme sua vida através do conhecimento',
  bannerButtonText: 'Iniciar jornada',
  homeSectionTitle: 'Cursos Disponíveis',
  homeSectionSubtitle: 'Conteúdos transformadores para você',
  homeEmptyState: 'Nenhum curso disponível no momento.'
};

const TextsContext = createContext<TextsContextType>({
  texts: defaultTexts,
  loading: true,
  updateTexts: async () => {}
});

export const useTexts = () => {
  return useContext(TextsContext);
};

export const TextsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [texts, setTexts] = useState<TextsData>(defaultTexts);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTexts = async () => {
      try {
        const docRef = doc(db, 'texts', 'main');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTexts({
            bannerTitle: data.bannerTitle || defaultTexts.bannerTitle,
            bannerSubtitle: data.bannerSubtitle || defaultTexts.bannerSubtitle,
            bannerButtonText: data.bannerButtonText || defaultTexts.bannerButtonText,
            homeSectionTitle: data.homeSectionTitle || defaultTexts.homeSectionTitle,
            homeSectionSubtitle: data.homeSectionSubtitle || defaultTexts.homeSectionSubtitle,
            homeEmptyState: data.homeEmptyState || defaultTexts.homeEmptyState
          });
        }
      } catch (error) {
        console.error('Erro ao carregar textos:', error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onSnapshot(doc(db, 'texts', 'main'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTexts({
          bannerTitle: data.bannerTitle || defaultTexts.bannerTitle,
          bannerSubtitle: data.bannerSubtitle || defaultTexts.bannerSubtitle,
          bannerButtonText: data.bannerButtonText || defaultTexts.bannerButtonText,
          homeSectionTitle: data.homeSectionTitle || defaultTexts.homeSectionTitle,
          homeSectionSubtitle: data.homeSectionSubtitle || defaultTexts.homeSectionSubtitle,
          homeEmptyState: data.homeEmptyState || defaultTexts.homeEmptyState
        });
      }
    });

    loadTexts();

    return () => unsubscribe();
  }, []);

  const updateTexts = async (data: Partial<TextsData>) => {
    try {
      const docRef = doc(db, 'texts', 'main');
      const currentData = texts;
      const newData = { ...currentData, ...data };
      
      await setDoc(docRef, newData, { merge: true });
      setTexts(newData);
    } catch (error) {
      console.error('Erro ao salvar textos:', error);
      throw error;
    }
  };

  const value: TextsContextType = {
    texts,
    loading,
    updateTexts
  };

  return (
    <TextsContext.Provider value={value}>
      {children}
    </TextsContext.Provider>
  );
};

