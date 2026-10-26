// src/components/common/Card.tsx
import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  icon,
  onClick,
  hover = true,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        bg-white dark:bg-slate-800 
        rounded-2xl p-6 
        border border-slate-200 dark:border-slate-700 
        shadow-sm 
        ${hover ? 'hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800/30 transition-all duration-300' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
      whileHover={hover ? { y: -2 } : {}}
    >
      {(title || icon) && (
        <div className="flex items-start justify-between mb-4">
          <div>
            {title && (
              <h3 className="font-semibold text-slate-800 dark:text-white">{title}</h3>
            )}
            {subtitle && (
              <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
            )}
          </div>
          {icon && (
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
              {icon}
            </div>
          )}
        </div>
      )}
      {children}
    </motion.div>
  );
};

export default Card;