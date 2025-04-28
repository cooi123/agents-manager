import React, { useState } from 'react';
import { Grid, Column, Tile, Button } from '@carbon/react';
import { Add } from '@carbon/icons-react';
import ProjectList from '../components/projects/ProjectList';
import ProjectForm from '../components/projects/ProjectForm';

const DashboardPage: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  return (
    <Grid fullWidth className="p-5">
      <Column lg={16} md={8} sm={4}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button 
            renderIcon={Add}
            onClick={() => setIsCreateModalOpen(true)}
          >
            New Project
          </Button>
        </div>
        
        <Tile className="p-5">
          <h2 className="text-xl font-semibold mb-4">Your Projects</h2>
          <ProjectList />
        </Tile>
      </Column>
      
      <ProjectForm 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </Grid>
  );
};

export default DashboardPage;