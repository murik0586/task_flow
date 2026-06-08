import React from 'react';
import { Button } from './Button';

export const ErrorMessage = ({ message, onRetry }) => {
  return (
    <div
      style={{
        padding: '1rem',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid var(--danger-color)',
        borderRadius: 'var(--radius)',
        color: 'var(--danger-color)',
        textAlign: 'center',
      }}
    >
      <p style={{ margin: '0 0 0.5rem 0' }}>{message || 'Произошла ошибка'}</p>
      {onRetry && (
        <Button variant="danger" onClick={onRetry} size="sm">
          Повторить
        </Button>
      )}
    </div>
  );
};