import React from 'react';
import { useCustomization } from '../context/CustomizationContext';
import './Logo.css';

const Logo: React.FC = () => {
  const { customization } = useCustomization();
  return (
    <div className="logo-container">
      <h1 className="logo-text" style={{ color: `var(--text-color, #ffffff)` }}>
        {customization.companyName}
      </h1>
    </div>
  );
};

export default Logo;

