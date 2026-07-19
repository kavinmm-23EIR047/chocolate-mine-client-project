import React from 'react';
import { useTheme } from '../context/ThemeContext';
import DarkLogo from '../assets/dark logo.png';
import LightLogo from '../assets/light gogo.png';

const Logo = ({ className = "w-12 h-12", variant = "default" }) => {
  const { isDark } = useTheme();
  const imageSrc = variant === 'light' || !isDark ? LightLogo : DarkLogo;

  return (
    <div className={`flex items-center justify-center overflow-hidden ${className}`}>
      <img
        src={imageSrc}
        alt="Logo"
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export default Logo;