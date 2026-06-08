// src/components/layout/HeaderContainer.jsx
import React from 'react';

export const HeaderContainer = ({ children }) => {
  return (
    <div style={{ maxWidth: '2000px', margin: '0 auto', padding: '0 1rem' }}>
      {children}
    </div>
  );
};