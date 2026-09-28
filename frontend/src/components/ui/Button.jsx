import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-primary text-button-text hover:bg-primary-hover active:scale-95 transition-all',
  secondary: 'bg-button-alt-bg text-button-alt-text border border-border hover:bg-button-alt-hover',
  danger: 'bg-error/10 text-error border border-error/30 hover:bg-error/20',
  success: 'bg-success/10 text-success border border-success/30 hover:bg-success/20',
  warning: 'bg-amber-600 hover:bg-amber-700 text-white shadow-md active:scale-95 transition-all',
  amber: 'bg-amber-600 hover:bg-amber-700 text-white shadow-md active:scale-95 transition-all',
  ghost: 'bg-transparent hover:bg-border text-body',
  outline: 'bg-transparent border border-input-border text-body hover:bg-input',
  'primary-outline': 'border-2 border-primary text-primary hover:bg-primary hover:text-button-text transition-all',
  'filter-active': 'bg-primary text-button-text shadow-sm hover:bg-primary-hover',
  'filter-inactive': 'bg-transparent border border-border/50 text-heading/70 hover:border-primary/40 hover:text-heading',
  raw: '',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3 text-base',
  'filter-sm': 'px-3 py-1.5 text-[11px]',
  'filter-md': 'px-4 py-2 text-[12px]',
};

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  isLoading = false,
  disabled = false,
  className = '',
  icon: Icon,
  active = false,
  onClick,
  type = 'button',
  preventDefault = false,
  stopPropagation = false,
  ...props
}, ref) => {
  // Handle click with optional prevent default and stop propagation
  const handleClick = (e) => {
    if (preventDefault) {
      e.preventDefault();
    }
    if (stopPropagation) {
      e.stopPropagation();
    }
    if (onClick && !disabled && !isLoading && !loading) {
      onClick(e);
    }
  };

  // Determine variant based on active state
  const getVariant = () => {
    if (variant === 'filter-active' || variant === 'filter-inactive') {
      return active ? 'filter-active' : 'filter-inactive';
    }
    return variant;
  };

  return (
    <motion.button
      ref={ref}
      type={type}
      whileHover={{ 
        scale: (disabled || isLoading || loading) ? 1 : 1.02,
        transition: { duration: 0.2 }
      }}
      whileTap={{ 
        scale: (disabled || isLoading || loading) ? 1 : 0.97,
        transition: { duration: 0.1 }
      }}
      className={`
        ui-button inline-flex items-center justify-center gap-2 font-bold rounded-lg
        transition-all duration-200 cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[getVariant()]} ${sizes[size]} ${className}
        ${active ? 'ring-2 ring-primary/30 ring-offset-2 ring-offset-background' : ''}
      `}
      disabled={disabled || isLoading || loading}
      aria-busy={isLoading || loading ? 'true' : undefined}
      onClick={handleClick}
      {...props}
    >
      {(isLoading || loading) ? (
        <Loader2 size={size === 'sm' ? 14 : 16} className="animate-spin" />
      ) : Icon ? (
        <Icon size={size === 'sm' ? 14 : 16} />
      ) : null}
      {children}
    </motion.button>
  );
});

Button.displayName = 'Button';

export default Button;
