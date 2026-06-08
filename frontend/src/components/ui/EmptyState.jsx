import React from 'react';
import { Button } from './Button';

export const EmptyState = ({ 
  title = 'Нет данных', 
  description = 'Здесь пока ничего нет', 
  icon = '📭',
  actionText,
  onAction 
}) => {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '4rem 1rem',
        backgroundColor: 'var(--card-bg)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border-color)',
      }}
    >
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{icon}</div>
      <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-color)' }}>{title}</h3>
      <p style={{ margin: '0 0 1.5rem 0', color: 'var(--secondary-color)' }}>{description}</p>
      {actionText && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};