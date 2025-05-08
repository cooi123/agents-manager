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
      <HeaderName href="/" prefix="">
        Agent as Service
      </HeaderName>
      <HeaderNavigation aria-label="Main Navigation">
        <HeaderMenuItem isCurrentPage={isActive('/dashboard')}>
          <Link
            to="/dashboard"
          >
            Dashboard
          </Link>
        </HeaderMenuItem>

        <HeaderMenuItem isCurrentPage={isActive('/personal')}>
          <Link
            to="/personal"
          >
            Personal Space
          </Link>
        </HeaderMenuItem>

        <HeaderMenuItem isCurrentPage={isActive('/services')}>
          <Link
            to="/services"
          >
            Service Gallery
          </Link>
        </HeaderMenuItem>

        {isAdmin() && (
          <HeaderMenuItem isCurrentPage={isActive('/admin')}>
            <Link
              to="/admin"
            >
              Admin
            </Link>
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