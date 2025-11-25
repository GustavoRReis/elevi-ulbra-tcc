import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// @ts-ignore
import Slider from 'react-slick';
import { useCustomization } from '../../context/CustomizationContext';
import { useTexts } from '../../context/TextsContext';
import { useAuth } from '../../context/AuthContext';
import EditIcon from '@mui/icons-material/Edit';
import BannerEditModal from '../BannerEditModal';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import './BannerMain.css';

const BannerMain: React.FC = () => {
  const { customization } = useCustomization();
  const { texts } = useTexts();
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const settings = {
    dots: true,
    arrows: true,
    infinite: true,
    speed: 800,
    autoplay: true,
    autoplaySpeed: 5000,
    slidesToShow: 1,
    slidesToScroll: 1,
  };

  const bannerTitle = texts.bannerTitle.replace('{companyName}', customization.companyName);

  return (
    <>
      <div className="main-banner">
        {userData?.isAdmin && (
          <button 
            className="btn-edit-banner"
            onClick={() => setIsEditModalOpen(true)}
            title="Editar textos do banner"
          >
            <EditIcon style={{ fontSize: '20px' }} />
          </button>
        )}
        <Slider {...settings}>
          <div className="banner-slide">
            <img 
              src={customization.bannerUrl || "https://images.unsplash.com/photo-1559234433-cee92ff1cd3a?q=80&w=1920&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"} 
              alt={`Banner Principal ${customization.companyName}`} 
              className="banner-image" 
              onError={(e) => {
                // Se a imagem do banner falhar, usar a imagem padrão
                e.currentTarget.src = "https://images.unsplash.com/photo-1559234433-cee92ff1cd3a?q=80&w=1920&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
              }}
            />
            <div className="banner-overlay" />
            <div className="banner-content">
              <h1 className="banner-title">{bannerTitle}</h1>
              <p className="banner-subtitle">{texts.bannerSubtitle}</p>
              <button 
                className="banner-button"
                onClick={() => navigate('/plans')}
              >
                {texts.bannerButtonText}
              </button>
            </div>
          </div>
        </Slider>
      </div>
      <BannerEditModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
      />
    </>
  );
};

export default BannerMain;

