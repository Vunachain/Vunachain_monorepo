import React, { ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, className = "" }) => {
  return (
    <div className={`group/tooltip relative inline-flex items-center justify-center ${className}`}>
      {children}
      <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs font-semibold text-white opacity-0 transition-opacity duration-200 group-hover/tooltip:opacity-100 pointer-events-none z-[60] dark:bg-white dark:text-gray-900 shadow-sm">
        {content}
        <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-white"></div>
      </div>
    </div>
  );
};

export default Tooltip;