export const Spinner = ({ size = 'md', fullPage = false }) => {
  const sizes = {
    sm: 20,
    md: 32,
    lg: 48,
  };

  const sizePx = sizes[size] || sizes.md;

  const spinner = (
    <div
      style={{
        width: sizePx,
        height: sizePx,
        border: `3px solid var(--border-color)`,
        borderTopColor: 'var(--primary-color)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
  );

  if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    if (!document.querySelector('#spinner-styles')) {
      style.id = 'spinner-styles';
      document.head.appendChild(style);
    }
  }

  if (fullPage) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255,255,255,0.8)',
          zIndex: 9999,
        }}
      >
        {spinner}
      </div>
    );
  }

  return spinner;
};