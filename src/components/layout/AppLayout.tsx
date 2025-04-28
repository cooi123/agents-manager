import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Content, Loading } from '@carbon/react';
import { useAuthStore } from '../../store/authStore';
import AppHeader from './AppHeader';

const AppLayout: React.FC = () => {
  const { user, loading, initialized, initialize } = useAuthStore();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);
  
  useEffect(() => {
    if (initialized && !loading && !user) {
      navigate('/login');
    }
  }, [initialized, loading, user, navigate]);
  
  if (!initialized || loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loading withOverlay={false} description="Loading..." />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <Content className="flex-grow">
        <Outlet />
      </Content>
    </div>
  );
};

export default AppLayout;