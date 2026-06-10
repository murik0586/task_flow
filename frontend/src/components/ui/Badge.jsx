import React from 'react';
import { STATUS_LABELS } from '../../constants/statusLabels';

export const Badge = ({ status, children }) => {
  const variants = {
    open: { 
      backgroundColor: 'rgba(34, 197, 94, 0.1)', 
      color: '#22c55e',
      border: '1px solid #22c55e',
    },
    work: { 
      backgroundColor: 'rgba(59, 130, 246, 0.1)', 
      color: '#3b82f6',
      border: '1px solid #3b82f6',
    },
    waiting: { 
      backgroundColor: 'rgba(245, 158, 11, 0.1)', 
      color: '#f59e0b',
      border: '1px solid #f59e0b',
    },
    close: { 
      backgroundColor: 'rgba(107, 114, 128, 0.1)', 
      color: '#6b7280',
      border: '1px solid #6b7280',
    },
    cancelled: { 
      backgroundColor: 'rgba(239, 68, 68, 0.1)', 
      color: '#ef4444',
      border: '1px solid #ef4444',
    },
  };

  const style = variants[status] || variants.open;
  
  const displayText = children || STATUS_LABELS[status] || status;

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 500,
        ...style,
      }}
    >
      {children || status}
    </span>
  );
};