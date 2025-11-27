import React from 'react';
import { Loader2 } from './Icons';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string; // New prop: custom text for loading state
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  isLoading, 
  loadingText = 'Processing...', // Default loading text
  variant = 'primary', 
  className = '', 
  disabled, 
  icon,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-primary hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 focus:ring-indigo-500",
    secondary: "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm focus:ring-slate-500",
    outline: "bg-transparent border border-primary text-primary hover:bg-indigo-50 focus:ring-indigo-500",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 focus:ring-red-500",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {loadingText} {/* Use the custom loadingText prop */}
        </>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};