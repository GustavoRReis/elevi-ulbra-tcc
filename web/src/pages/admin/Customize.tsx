import React, { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useCustomization } from '../../context/CustomizationContext';
import './Customize.css';

const Customize: React.FC = () => {
  const { customization, updateCustomization } = useCustomization();
  const [formData, setFormData] = useState({ 
    primaryColor: customization.primaryColor, 
    secondaryColor: customization.secondaryColor,
    logoUrl: customization.logoUrl,
    bannerUrl: customization.bannerUrl,
    companyName: customization.companyName,
    textColor: customization.textColor
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setFormData({
      primaryColor: customization.primaryColor,
      secondaryColor: customization.secondaryColor,
      logoUrl: customization.logoUrl,
      bannerUrl: customization.bannerUrl,
      companyName: customization.companyName,
      textColor: customization.textColor
    });
  }, [customization]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await setDoc(doc(db, 'customization', 'main'), {
        ...formData,
        updatedAt: new Date()
      });
      
      // Atualizar o contexto para aplicar as cores imediatamente
      updateCustomization(formData);
      
      setMessage('Personalização salva com sucesso! As cores foram aplicadas em todo o sistema.');
    } catch (error) {
      console.error('Erro ao salvar personalização:', error);
      setMessage('Erro ao salvar personalização');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="customize-management">
      <div className="customize-management-header">
        <h2>Personalizar Layout</h2>
        <p>Customize a identidade visual do sistema</p>
      </div>

        {message && (
          <div className={message.includes('sucesso') ? 'success-message' : 'error-message'}>
            {message}
          </div>
        )}

        <div className="customize-form-container">
          <form onSubmit={handleSubmit} className="customize-form">
            <div className="form-group">
              <label>Nome da Empresa</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                required
                placeholder="Nome da sua empresa"
              />
            </div>
            <div className="form-group">
              <label>Cor Primária</label>
              <div className="color-input-group">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                />
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  placeholder="#4a90e2"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Cor Secundária</label>
              <div className="color-input-group">
                <input
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                />
                <input
                  type="text"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  placeholder="#667eea"
                />
              </div>
            </div>
            <div className="form-group">
              <label>URL do Logo (opcional)</label>
              <input
                type="url"
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                placeholder="https://exemplo.com/logo.png"
              />
            </div>
            <div className="form-group">
              <label>URL da Imagem do Banner (opcional)</label>
              <input
                type="url"
                value={formData.bannerUrl}
                onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })}
                placeholder="https://exemplo.com/banner.jpg"
              />
              <p style={{ fontSize: '0.875rem', color: 'var(--primary-color)', opacity: 0.7, marginTop: '8px' }}>
                Esta imagem será exibida como banner principal na home do sistema
              </p>
            </div>
            <div className="form-group">
              <label>Cor das Fontes Principais</label>
              <p style={{ fontSize: '0.875rem', color: 'var(--primary-color)', opacity: 0.7, marginTop: '-8px', marginBottom: '8px' }}>
                Cor usada em textos do header, banner e outros elementos principais
              </p>
              <div className="color-input-group">
                <input
                  type="color"
                  value={formData.textColor}
                  onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                />
                <input
                  type="text"
                  value={formData.textColor}
                  onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                  placeholder="#ffffff"
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Salvando...' : 'Salvar Personalização'}
            </button>
          </form>
        </div>
    </div>
  );
};

export default Customize;

