import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import AppLayout from './components/layout/AppLayout';
import AdminLayout from './components/layout/AdminLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ProfilePage from './pages/ProfilePage';
import DocumentPage from './pages/DocumentPage';
import PersonalDocumentPage from './pages/PersonalDocumentPage';
import ServiceTransactionsPage from './pages/ServiceTransactionsPage';
import MyDocumentsPage from './pages/MyDocumentsPage';
import ServicesPage from './pages/ServicesPage';
import ServiceDetailsPage from './pages/ServiceDetailsPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminProjectsPage from './pages/admin/AdminProjectsPage';
import AdminDocumentsPage from './pages/admin/AdminDocumentsPage';
import AdminServicesPage from './pages/admin/AdminServicesPage';

// Import Carbon Design System styles
import '@carbon/react/index.scss';
import './index.css';

function App() {
  const { initialize, initialized } = useAuthStore();
  
  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialize, initialized]);
  
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="projects/:projectId/documents/:documentId" element={<DocumentPage />} />
          <Route path="projects" element={<Navigate to="/dashboard" replace />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="my-documents" element={<MyDocumentsPage />} />
          <Route path="my-documents/:documentId" element={<PersonalDocumentPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="services/transactions" element={<ServiceTransactionsPage />} />
          <Route path="services/:id" element={<ServiceDetailsPage />} />
        </Route>
        
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="projects" element={<AdminProjectsPage />} />
          <Route path="documents" element={<AdminDocumentsPage />} />
          <Route path="services" element={<AdminServicesPage />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;