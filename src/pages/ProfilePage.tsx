import React from 'react';
import { Grid, Column, Tile } from '@carbon/react';
import { useAuthStore } from '../store/authStore';

const ProfilePage: React.FC = () => {
  const { user, role } = useAuthStore();
  
  if (!user) return null;
  
  return (
    <Grid fullWidth className="p-5">
      <Column lg={8} md={6} sm={4} className="mx-auto">
        <Tile className="p-5">
          <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
          
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Email</h2>
            <p>{user.email}</p>
          </div>
          
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Role</h2>
            <p className="capitalize">{role}</p>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold">Account ID</h2>
            <p className="text-sm font-mono">{user.id}</p>
          </div>
        </Tile>
      </Column>
    </Grid>
  );
};

export default ProfilePage;