import React, { useEffect } from 'react';
import { Grid, Column, Loading, Tag } from '@carbon/react';
import { useServiceStore } from '../store/serviceStore';
import ServiceCard from '../components/services/ServiceCard';

const ServicesPage: React.FC = () => {
  const { services, loading, fetchServices } = useServiceStore();
  
  useEffect(() => {
    fetchServices();
  }, [fetchServices]);
  
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loading withOverlay={false} description="Loading services..." />
      </div>
    );
  }
  
  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Tag type="cool-gray">No Services</Tag>
        <p className="mt-4">No services are available at the moment</p>
      </div>
    );
  }
  
  return (
    <Grid fullWidth className="p-5">
      <Column lg={16} md={8} sm={4}>
        <h1 className="text-3xl font-bold mb-6">Available Services</h1>
      </Column>
      
      {services.map((service) => (
        <Column key={service.id} lg={8} md={4} sm={4} className="mb-4">
          <ServiceCard service={service} />
        </Column>
      ))}
    </Grid>
  );
};

export default ServicesPage;