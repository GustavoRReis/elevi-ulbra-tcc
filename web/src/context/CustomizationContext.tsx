import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

interface CustomizationData {
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  bannerUrl: string;
  companyName: string;
  textColor: string;
}

interface CustomizationContextType {
  customization: CustomizationData;
  loading: boolean;
  updateCustomization: (data: Partial<CustomizationData>) => void;
}

const defaultCustomization: CustomizationData = {
  primaryColor: '#7c6322',
  secondaryColor: '#edebe9',
  logoUrl: '',
  bannerUrl: '',
  companyName: 'ELEVI',
  textColor: '#ffffff'
};

const CustomizationContext = createContext<CustomizationContextType>({
  customization: defaultCustomization,
  loading: true,
  updateCustomization: () => {}
});

export const useCustomization = () => {
  return useContext(CustomizationContext);
};

export const CustomizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customization, setCustomization] = useState<CustomizationData>(defaultCustomization);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carregar personalização do Firestore
    const loadCustomization = async () => {
      try {
        const docRef = doc(db, 'customization', 'main');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          const customData: CustomizationData = {
            primaryColor: data.primaryColor || defaultCustomization.primaryColor,
            secondaryColor: data.secondaryColor || defaultCustomization.secondaryColor,
            logoUrl: data.logoUrl || defaultCustomization.logoUrl,
            bannerUrl: data.bannerUrl || defaultCustomization.bannerUrl,
            companyName: data.companyName || defaultCustomization.companyName,
            textColor: data.textColor || defaultCustomization.textColor
          };
          setCustomization(customData);
          applyCustomization(customData);
        } else {
          applyCustomization(defaultCustomization);
        }
      } catch (error) {
        console.error('Erro ao carregar personalização:', error);
        applyCustomization(defaultCustomization);
      } finally {
        setLoading(false);
      }
    };

    // Escutar mudanças em tempo real
    const unsubscribe = onSnapshot(doc(db, 'customization', 'main'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const customData: CustomizationData = {
          primaryColor: data.primaryColor || defaultCustomization.primaryColor,
          secondaryColor: data.secondaryColor || defaultCustomization.secondaryColor,
          logoUrl: data.logoUrl || defaultCustomization.logoUrl,
          bannerUrl: data.bannerUrl || defaultCustomization.bannerUrl,
          companyName: data.companyName || defaultCustomization.companyName,
          textColor: data.textColor || defaultCustomization.textColor
        };
        setCustomization(customData);
        applyCustomization(customData);
      }
    });

    loadCustomization();

    return () => unsubscribe();
  }, []);

  const applyCustomization = (data: CustomizationData) => {
    // Aplicar cores como CSS variables
    const root = document.documentElement;
    root.style.setProperty('--primary-color', data.primaryColor);
    root.style.setProperty('--secondary-color', data.secondaryColor);
    root.style.setProperty('--primary-color-dark', darkenColor(data.primaryColor, 10));
    root.style.setProperty('--primary-color-light', lightenColor(data.primaryColor, 10));
    root.style.setProperty('--text-color', data.textColor);
  };

  const darkenColor = (color: string, percent: number): string => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) - amt));
    const G = Math.max(0, Math.min(255, (num >> 8 & 0x00FF) - amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000FF) - amt));
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  };

  const lightenColor = (color: string, percent: number): string => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) + amt));
    const G = Math.max(0, Math.min(255, (num >> 8 & 0x00FF) + amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  };

  const updateCustomization = (data: Partial<CustomizationData>) => {
    setCustomization(prev => {
      const newData = { ...prev, ...data };
      applyCustomization(newData);
      return newData;
    });
  };

  const value: CustomizationContextType = {
    customization,
    loading,
    updateCustomization
  };

  return (
    <CustomizationContext.Provider value={value}>
      {children}
    </CustomizationContext.Provider>
  );
};

