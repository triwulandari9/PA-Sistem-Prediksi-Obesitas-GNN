import React from 'react';
import logoImg from '../assets/logo.png';

export const Logo = ({ className = "w-10 h-10" }) => {
  return (
    <img 
      src={logoImg} 
      alt="Logo Sistem Prediksi Obesitas" 
      className={`object-contain ${className}`}
    />
  );
};
