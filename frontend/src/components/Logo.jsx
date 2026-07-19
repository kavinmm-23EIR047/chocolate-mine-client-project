import React from 'react';
import { useTheme } from '../context/ThemeContext';
import DarkLogo from '../assets/dark logo.png';
import LightLogo from '../assets/light logo.png';

const Logo = ({ className = "w-12 h-12", variant = "default" }) => {
  const { isDark } = useTheme();
  let imageSrc;
  
  if (variant === 'light') {
    imageSrc = LightLogo;
  } else if (variant === 'dark') {
    imageSrc = DarkLogo;
  } else {
    imageSrc = isDark ? DarkLogo : LightLogo;
  }

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