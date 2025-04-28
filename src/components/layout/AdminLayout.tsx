import React, { useEffect } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { 
  Content, 
  SideNav, 
  SideNavItems, 
  SideNavLink, 
  SideNavDivider,
  Loading 
} from '@carbon/react';
import { Dashboard, User, Document, FolderDetails, Settings } from '@carbon/icons-react';
import { useAuthStore } from '../../store/authStore';
import AppHeader from './AppHeader';

const AdminLayout: React.FC = () => {
  const { role, loading } = useAuthStore();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!loading && role !== 'admin') {
      navigate('/dashboard');
    }
  }, [loading, role, navigate]);
  
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loading withOverlay={false} description="Loading..." />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <div className="flex flex-grow">
        <SideNav
          expanded
          isChildOfHeader={false}
          aria-label="Admin Navigation"
        >
          <SideNavItems>
            <SideNavLink
              renderIcon={Dashboard}
              element={Link}
              to="/admin"
            >
              Overview
            </SideNavLink>
            <SideNavLink
              renderIcon={User}
              element={Link}
              to="/admin/users"
            >
              Users
            </SideNavLink>
            <SideNavLink
              renderIcon={FolderDetails}
              element={Link}
              to="/admin/projects"
            >
              Projects
            </SideNavLink>
            <SideNavLink
              renderIcon={Document}
              element={Link}
              to="/admin/documents"
            >
              Documents
            </SideNavLink>
            <SideNavLink
              renderIcon={Settings}
              element={Link}
              to="/admin/services"
            >
              Services
            </SideNavLink>
            <SideNavDivider />
            <SideNavLink
              element={Link}
              to="/dashboard"
            >
              Back to Dashboard
            </SideNavLink>
          </SideNavItems>
        </SideNav>
        <Content className="flex-grow p-5">
          <Outlet />
        </Content>
      </div>
    </div>
  );
};

export default AdminLayout;