import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { 
  Content, 
  SideNav, 
  SideNavItems, 
  SideNavLink, 
  SideNavDivider,
  Loading,
  Button 
} from '@carbon/react';
import { 
  Dashboard, 
  User, 
  Document, 
  FolderDetails, 
  Settings, 
  Menu, 
  Close,
  ChevronLeft,
  ChevronRight
} from '@carbon/icons-react';
import { useAuthStore } from '../../store/authStore';
import AppHeader from './AppHeader';

const AdminLayout: React.FC = () => {
  const { role, loading } = useAuthStore();
  const navigate = useNavigate();
  const [sideNavExpanded, setSideNavExpanded] = useState(false); // Start collapsed on mobile
  
  const toggleSideNav = () => {
    setSideNavExpanded(!sideNavExpanded);
  };
  
  useEffect(() => {
    if (!loading && role !== 'admin') {
      navigate('/dashboard');
    }
    
    // Set sidebar expanded by default on larger screens
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSideNavExpanded(true);
      } else {
        setSideNavExpanded(false);
      }
    };
    
    // Initial check
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
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
      <div className="flex-grow flex relative mt-12"> {/* Added mt-12 to ensure content is below header */}

        <SideNav
          expanded={sideNavExpanded}
          isChildOfHeader={false}
          aria-label="Admin Navigation"
          className={`fixed left-0 top-12 bottom-0 z-40 transition-all duration-300 flex flex-col ${sideNavExpanded ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-12'}`}
        >
          <SideNavItems className="flex-grow">
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
              renderIcon={ChevronLeft}
            >
              Back to Dashboard
            </SideNavLink>
          </SideNavItems>
          
          {/* Collapse button at the bottom of the sidebar */}
          <div className="p-2 flex justify-end border-t border-gray-200 z-50">
            <Button
              kind="ghost"
       
              renderIcon={sideNavExpanded ? ChevronLeft : ChevronRight}
              onClick={toggleSideNav}
              size="sm"
              className="hover:bg-gray-100 z-50"
            />
          </div>
        </SideNav>

        <Content 
          className={`w-full p-5 transition-all duration-300 ${sideNavExpanded ? 'ml-0 md:ml-48' : 'ml-0 md:ml-12'}`}
        >
          <Outlet />
        </Content>
      </div>
    </div>
  );
};

export default AdminLayout;