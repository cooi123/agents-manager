import React, { useState } from 'react';
import { Grid, Column, Tile, Button } from '@carbon/react';
import { Add } from '@carbon/icons-react';
import ServiceList from '../../components/admin/ServiceList';
import ServiceForm from '../../components/admin/ServiceForm';

const AdminServicesPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  
  const handleEdit = (service: any) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };
  
  const handleClose = () => {
    setIsModalOpen(false);
    setSelectedService(null);
  };
  
  return (
    <>
      <h1 className="text-3xl font-bold mb-6">Service Management</h1>
      
      <Grid fullWidth>
        <Column lg={16} md={8} sm={4}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Services</h2>
            <Button
              renderIcon={Add}
              onClick={() => setIsModalOpen(true)}
            >
              Add Service
            </Button>
          </div>
          
          <Tile className="p-5">
            <ServiceList onEdit={handleEdit} />
          </Tile>
        </Column>
      </Grid>
      
      <ServiceForm
        isOpen={isModalOpen}
        onClose={handleClose}
        service={selectedService}
      />
    </>
  );
};

export default AdminServicesPage;