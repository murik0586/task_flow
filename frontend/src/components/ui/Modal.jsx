import { useEffect } from 'react';
import { Button } from './Button';

export const Modal = ({ isOpen, onClose, title, children, onConfirm, confirmText = 'Подтвердить', cancelText = 'Отмена' }) => {
  // Закрытие по Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Затемнённый фон (overlay) */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={onClose}
      >
        {/* Окно модалки */}
        <div
          style={{
            backgroundColor: 'var(--card-bg)',
            borderRadius: 'var(--radius)',
            padding: '1.5rem',
            minWidth: '300px',
            maxWidth: '500px',
            width: 'auto',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {title && (
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-color)' }}>
              {title}
            </h3>
          )}
          <div style={{ marginBottom: '1.5rem' }}>
            {children}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={onClose}>
              {cancelText}
            </Button>
            {onConfirm && (
              <Button variant="primary" onClick={onConfirm}>
                {confirmText}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};