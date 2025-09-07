import React from 'react';
import { motion } from 'framer-motion';

const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  className = '',
  leftIcon,
  rightIcon,
  isLoading = false,
  ...props
}) => {
  // Button variant styles
  const variants = {
    primary: 'bg-mpesa-green text-white hover:bg-mpesa-dark focus:ring-mpesa-light',
    secondary: 'bg-white text-mpesa-green border border-mpesa-green hover:bg-gray-50 focus:ring-mpesa-light',
    outline: 'bg-transparent text-mpesa-green border border-mpesa-green hover:bg-mpesa-green/10 focus:ring-mpesa-light',
    ghost: 'bg-transparent text-mpesa-green hover:bg-mpesa-green/10 focus:ring-mpesa-light',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-300'
  };

  // Button sizes
  const sizes = {
    xs: 'py-1 px-2 text-xs',
    sm: 'py-1.5 px-3 text-sm',
    md: 'py-2 px-4 text-sm',
    lg: 'py-2.5 px-5 text-base',
    xl: 'py-3 px-6 text-lg'
  };

  // Loading spinner animation
  const spinTransition = {
    repeat: Infinity,
    ease: "linear",
    duration: 1
  };

  return (
    <button
      type={type}
      className={`
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${fullWidth ? 'w-full' : ''}
        rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2
        transition-all duration-200 ease-in-out
        flex items-center justify-center
        disabled:opacity-70 disabled:cursor-not-allowed
        ${className}
      `}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center">
          <motion.span
            className="inline-block w-4 h-4 border-2 border-current border-r-transparent rounded-full mr-2"
            animate={{ rotate: 360 }}
            transition={spinTransition}
          />
          <span>{children}</span>
        </div>
      ) : (
        <>
          {leftIcon && <span className="mr-2">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="ml-2">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};

export default Button;
