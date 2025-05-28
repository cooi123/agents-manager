import React, { useState } from 'react';
import {
  Header,
  HeaderContainer,
  HeaderName,
  HeaderNavigation,
  HeaderGlobalBar,
  HeaderGlobalAction,
  SkipToContent,
  HeaderMenuItem,
} from '@carbon/react';
import { Logout, User } from '@carbon/icons-react';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { useNavigate, Link, useLocation } from 'react-router-dom';

const AppHeader: React.FC = () => {
  const { signOut } = useAuthStore();
  const { currentUser, isAdmin } = useUserStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname.startsWith(path);


  return (
    <Header aria-label="Agent as Service">
      <SkipToContent />
      <HeaderName href="/agents-manager" prefix="Agent as Service">
        Agent as Service
      </HeaderName>
      <HeaderNavigation aria-label="Main Navigation">
        <HeaderMenuItem 
          style={{ cursor: 'pointer' }}
          isCurrentPage={isActive('/dashboard')}
          onClick={() => navigate('/dashboard')}
        >
          Dashboard
        </HeaderMenuItem>

        <HeaderMenuItem 
          style={{ cursor: 'pointer' }}
          isCurrentPage={isActive('/personal')}
          onClick={() => navigate('/personal')}
        >
          Personal Space
        </HeaderMenuItem>

        <HeaderMenuItem 
          style={{ cursor: 'pointer' }}
          isCurrentPage={isActive('/services')}
          onClick={() => navigate('/services')}
        >
          Service Gallery
        </HeaderMenuItem>

        {isAdmin() && (
          <HeaderMenuItem 
            style={{ cursor: 'pointer' }}
            isCurrentPage={isActive('/admin')}
            onClick={() => navigate('/admin')}
          >
            Admin
          </HeaderMenuItem>
        )}
      </HeaderNavigation>

      {currentUser && (
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
      )}
    </Header>
  );
};

export default AppHeader;