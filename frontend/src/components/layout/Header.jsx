import React from 'react';
import { HeaderContainer } from './HeaderContainer'; 

export const Header = () => {
  return (
    <header style={{ 
      backgroundColor: 'var(--card-bg)', 
      borderBottom: '1px solid var(--border-color)',
      padding: '1rem 0'
    }}>
      <HeaderContainer>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',      
          gap: '1rem'            
        }}>
          <h2 style={{ margin: 0 }}>TaskFlow</h2>
          <div style={{ 
            display: 'flex', 
            gap: '1rem',
            flexWrap: 'wrap'     
          }}>
            <span>Главная</span>
            <span>Задачи</span>
            <span>Категории</span>
            <span>Войти</span>
          </div>
        </div>
      </HeaderContainer>
    </header>
  );
};