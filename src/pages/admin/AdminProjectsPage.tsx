import React from 'react';
import { Grid, Column, Tile } from '@carbon/react';
import AdminProjectList from '../../components/admin/AdminProjectList';

const AdminProjectsPage: React.FC = () => {
  return (
    <>
      <h1 className="text-3xl font-bold mb-6">Project Management</h1>
      
      <Grid fullWidth>
        <Column lg={16} md={8} sm={4}>
          <Tile className="p-5">
            <h2 className="text-xl font-semibold mb-4">All Projects</h2>
            <AdminProjectList />
          </Tile>
        </Column>
      </Grid>
    </>
  );
};

export default AdminProjectsPage;