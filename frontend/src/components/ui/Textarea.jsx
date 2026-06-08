import React from 'react';

export const Textarea = ({
  label,
  name,
  value,
  onChange,
  error,
  placeholder = '',
  rows = 4,
  required = false,
}) => {
  const textareaStyle = {
    width: '100%',
    padding: '0.5rem',
    border: `1px solid ${error ? 'var(--danger-color)' : 'var(--border-color)'}`,
    borderRadius: 'var(--radius)',
    fontSize: '1rem',
    fontFamily: 'inherit',
    backgroundColor: 'white',
    color: 'var(--text-color)',
    resize: 'vertical',
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      {label && (
        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500, color: 'var(--text-color)' }}>
          {label} {required && <span style={{ color: 'var(--danger-color)' }}>*</span>}
        </label>
      )}
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        style={textareaStyle}
      />
      {error && (
        <div style={{ color: 'var(--danger-color)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
          {error}
        </div>
      )}
    </div>
  );
};