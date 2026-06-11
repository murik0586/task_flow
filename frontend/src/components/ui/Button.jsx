export const Button = ({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  disabled = false,
  size = 'md',
  className = '',
  style = {},
}) => {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    borderRadius: '0.375rem',
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    border: 'none',
    transition: 'all 0.2s',
    paddingTop: '0.20rem',
    paddingBottom: '0.35rem'
  };

  const variants = {
    primary: {
      backgroundColor: 'var(--primary-color)',
      color: 'white',
    },
    secondary: {
      backgroundColor: 'var(--secondary-color)',
      color: 'white',
    },
    danger: {
      backgroundColor: 'var(--danger-color)',
      color: 'white',
    },
  };

  const sizes = {
    sm: { padding: '0.25rem 0.75rem', fontSize: '0.75rem' },
    md: { padding: '0.5rem 1rem', fontSize: '0.875rem' },
    lg: { padding: '0.75rem 1.5rem', fontSize: '1rem' },
  };

  const styles = { ...baseStyles, ...sizes[size], ...variants[variant], ...style };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={styles}
      className={className}
    >
      {children}
    </button>
  );
};