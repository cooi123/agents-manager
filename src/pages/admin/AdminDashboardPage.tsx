import React, { useEffect, useState } from 'react';
import { Grid, Column, Tile, Tag } from '@carbon/react';
import { Document, User, FolderDetails } from '@carbon/icons-react';
import { useProjectStore } from '../../store/projectStore';
import { useDocumentStore } from '../../store/documentStore';
import { useUserStore } from '../../store/userStore';

const AdminDashboardPage: React.FC = () => {
  const { projects, fetchAllProjects } = useProjectStore();
  const { projectDocuments: documents, fetchAllDocuments } = useDocumentStore();
  const { users, fetchUsers } = useUserStore();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchAllProjects(),
        fetchAllDocuments(),
        fetchUsers(),
      ]);
      setLoading(false);
    };
    
    loadData();
  }, [fetchAllProjects, fetchAllDocuments, fetchUsers]);
  
  return (
    <>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <Grid fullWidth>
        <Column lg={5} md={4} sm={4} className="mb-5">
          <Tile className="h-full p-5">
            <div className="flex items-center mb-4">
              <User size={24} className="mr-2" />
              <h2 className="text-xl font-semibold">Users</h2>
            </div>
            <div className="flex items-center">
              <span className="text-4xl font-bold mr-2">{users.length}</span>
              <Tag type="blue">Total Users</Tag>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              {loading ? 'Loading...' : 'Users registered in the system'}
            </p>
          </Tile>
        </Column>
        
        <Column lg={5} md={4} sm={4} className="mb-5">
          <Tile className="h-full p-5">
            <div className="flex items-center mb-4">
              <FolderDetails size={24} className="mr-2" />
              <h2 className="text-xl font-semibold">Projects</h2>
            </div>
            <div className="flex items-center">
              <span className="text-4xl font-bold mr-2">{projects.length}</span>
              <Tag type="teal">Total Projects</Tag>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              {loading ? 'Loading...' : 'Projects created by all users'}
            </p>
          </Tile>
        </Column>
        
        <Column lg={5} md={4} sm={4} className="mb-5">
          <Tile className="h-full p-5">
            <div className="flex items-center mb-4">
              <Document size={24} className="mr-2" />
              <h2 className="text-xl font-semibold">Documents</h2>
            </div>
            <div className="flex items-center">
              <span className="text-4xl font-bold mr-2">{documents.length}</span>
              <Tag type="purple">Total Documents</Tag>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              {loading ? 'Loading...' : 'Documents uploaded across all projects'}
            </p>
          </Tile>
        </Column>
      </Grid>
      
      <Grid fullWidth>
        <Column lg={16} md={8} sm={4}>
          <Tile className="p-5">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            {loading ? (
              <p>Loading recent activity...</p>
            ) : (
              documents.length > 0 ? (
                <ul>
                  {documents.slice(0, 5).map(doc => (
                    <li key={doc.id} className="mb-2 pb-2 border-b">
                      Document <strong>{doc.filename}</strong> was uploaded
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No recent activity</p>
              )
            )}
          </Tile>
        </Column>
      </Grid>
    </>
  );
};

export default AdminDashboardPage;