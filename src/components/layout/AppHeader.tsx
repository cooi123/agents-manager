import React from 'react';
import {
  Header,
  HeaderName,
  HeaderNavigation,
  HeaderMenuItem,
  HeaderGlobalBar,
  HeaderGlobalAction,
  SkipToContent,
} from '@carbon/react';
import { Logout, User } from '@carbon/icons-react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate, Link } from 'react-router-dom';

const AppHeader: React.FC = () => {
  const { user, role, signOut } = useAuthStore();
  const navigate = useNavigate();
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };
  
  const isAdmin = role === 'admin';
  
  return (
    <Header aria-label="Document Management">
      <SkipToContent />
      <HeaderName element={Link} to="/dashboard" prefix="">
        Document Manager
      </HeaderName>
      
      {user && (
        <>
          <HeaderNavigation aria-label="Main Navigation">
            <HeaderMenuItem element={Link} to="/dashboard">
              Dashboard
            </HeaderMenuItem>
            <HeaderMenuItem element={Link} to="/projects">
              Projects
            </HeaderMenuItem>
            <HeaderMenuItem element={Link} to="/my-documents">
              My Documents
            </HeaderMenuItem>
            <HeaderMenuItem element={Link} to="/services/transactions">
              Service History
            </HeaderMenuItem>
            <HeaderMenuItem element={Link} to="/services">
              Services
            </HeaderMenuItem>
            {isAdmin && (
              <HeaderMenuItem element={Link} to="/admin">
                Admin
              </HeaderMenuItem>
            )}
          </HeaderNavigation>
          
          <HeaderGlobalBar>
            <HeaderGlobalAction 
              aria-label="User Profile" 
              tooltipAlignment="center"
              onClick={() => navigate('/profile')}
            >
              <User size={20} />
            </HeaderGlobalAction>
            <HeaderGlobalAction 
              aria-label="Log Out" 
              tooltipAlignment="center"
              onClick={handleSignOut}
            >
              <Logout size={20} />
            </HeaderGlobalAction>
          </HeaderGlobalBar>
        </>
      )}
    </Header>
  );
};

export default AppHeader;