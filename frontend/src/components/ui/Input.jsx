export const Input = ({
  label,
  name,
  value,
  onChange,
  error,
  type = 'text',
  placeholder = '',
  required = false,
}) => {
  const inputId = name || (label ? `field-${label.toLowerCase()}` : undefined);
  const inputStyle = {
    width: '100%',
    padding: '0.5rem',
    border: `1px solid ${error ? 'var(--danger-color)' : 'var(--border-color)'}`,
    borderRadius: 'var(--radius)',
    fontSize: '1rem',
    backgroundColor: 'var(--control-bg)',
    color: 'var(--text-color)',
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}
        >
          {label} {required && <span style={{ color: 'var(--danger-color)' }}>*</span>}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={inputStyle}
      />
      {error && <div style={{ color: 'var(--danger-color)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{error}</div>}
    </div>
  );
};