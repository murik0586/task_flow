import './styles/global.css';
import { AppRouter } from './routes/AppRouter';
import { AuthProvider } from './store/AuthContext';
import { ThemeProvider } from './store/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;