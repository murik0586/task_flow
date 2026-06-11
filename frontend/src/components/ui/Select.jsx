export const Select = ({
  label,
  name,
  value,
  onChange,
  options = [],
  error,
  required = false,
  placeholder = 'Выберите...',
}) => {
  const selectStyle = {
    width: '100%',
    padding: '0.5rem',
    border: `1px solid ${error ? 'var(--danger-color)' : 'var(--border-color)'}`,
    borderRadius: 'var(--radius)',
    fontSize: '1rem',
    backgroundColor: 'var(--control-bg)',
    color: 'var(--text-color)',
    cursor: 'pointer',
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      {label && (
        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
          {label} {required && <span style={{ color: 'var(--danger-color)' }}>*</span>}
        </label>
      )}
      <select
        name={name}
        value={value}
        onChange={onChange}
        style={selectStyle}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <div style={{ color: 'var(--danger-color)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
          {error}
        </div>
      )}
    </div>
  );
};