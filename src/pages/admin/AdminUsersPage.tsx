import React from 'react';
import { Grid, Column, Tile } from '@carbon/react';
import UserList from '../../components/admin/UserList';

const AdminUsersPage: React.FC = () => {
  return (
    <>
      <h1 className="text-3xl font-bold mb-6">User Management</h1>
      
      <Grid fullWidth>
        <Column lg={16} md={8} sm={4}>
          <Tile className="p-5">
            <h2 className="text-xl font-semibold mb-4">All Users</h2>
            <UserList />
          </Tile>
        </Column>
      </Grid>
    </>
  );
};

export default AdminUsersPage;