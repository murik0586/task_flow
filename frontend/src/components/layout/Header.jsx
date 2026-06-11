import { useContext } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { AuthContext } from '../../store/AuthContext';
import { ThemeContext } from '../../store/ThemeContext';
import { HeaderContainer } from './HeaderContainer'; 

export const Header = () => {
  const { isAuthenticated, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const linkStyle = ({ isActive }) => ({
    color: isActive ? 'var(--primary-color)' : 'var(--text-color)',
    fontWeight: isActive ? 700 : 500,
    textDecoration: 'none',
  });

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
          <Link to="/" style={{ color: 'var(--text-color)', textDecoration: 'none' }}>
            <h2 style={{ margin: 0 }}>TaskFlow</h2>
          </Link>
          <div style={{ 
            display: 'flex', 
            gap: '1rem',
            flexWrap: 'wrap'     
          }}>
            <NavLink to="/" style={linkStyle}>Главная</NavLink>
            {isAuthenticated && (
              <>
                <NavLink to="/tasks" style={linkStyle}>Задачи</NavLink>
                <NavLink to="/categories" style={linkStyle}>Категории</NavLink>
                <NavLink to="/profile" style={linkStyle}>Профиль</NavLink>
              </>
            )}
            {isAuthenticated ? (
              <button
                type="button"
                onClick={logout}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--danger-color)',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Выйти
              </button>
            ) : (
              <NavLink to="/login" style={linkStyle}>Войти</NavLink>
            )}
            <button
              type="button"
              onClick={toggleTheme}
              className="theme-toggle"
              aria-label="Переключить тему"
            >
              {theme === 'dark' ? 'Светлая' : 'Тёмная'}
            </button>
          </div>
        </div>
      </HeaderContainer>
    </header>
  );
};