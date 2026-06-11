import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { TasksPage } from '../pages/TasksPage';
import { TaskDetailsPage } from '../pages/TaskDetailsPage';
import { CategoriesPage } from '../pages/CategoriesPage';
import { ProfilePage } from '../pages/ProfilePage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ProtectedRoute } from './ProtectedRoute';

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/tasks/:taskId" element={<TaskDetailsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};
