import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Grid, Column, Tile, Button, Loading, Tag } from '@carbon/react';
import { ArrowLeft } from '@carbon/icons-react';
import { useServiceStore } from '../store/serviceStore';
import ServiceUsageForm from '../components/services/ServiceUsageForm';

const ServiceDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { services, loading, fetchServices } = useServiceStore();
  const [service, setService] = useState<any>(null);
  const [isUsageFormOpen, setIsUsageFormOpen] = useState(false);
  
  useEffect(() => {
    fetchServices();
  }, [fetchServices]);
  
  useEffect(() => {
    if (services.length > 0 && id) {
      const foundService = services.find(s => s.id === id);
      setService(foundService || null);
    }
  }, [services, id]);
  
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loading withOverlay={false} description="Loading service details..." />
      </div>
    );
  }
  
  if (!service) {
    return (
      <div className="h-full flex items-center justify-center">
        <Tag type="red">Service not found</Tag>
      </div>
    );
  }
  
  return (
    <Grid fullWidth className="p-5">
      <Column lg={16} md={8} sm={4}>
        <Button
          kind="ghost"
          renderIcon={ArrowLeft}
          onClick={() => navigate('/services')}
          className="mb-6"
        >
          Back to Services
        </Button>
        
        <Tile className="p-5 mb-5">
          <h1 className="text-3xl font-bold mb-4">{service.name}</h1>
          {service.description && (
            <p className="text-gray-600 mb-6">{service.description}</p>
          )}
          
          {service.instructions && (
            <>
              <h2 className="text-xl font-semibold mb-3">Instructions</h2>
              <div className="prose max-w-none mb-6">
                {service.instructions}
              </div>
            </>
          )}
          
          <div className="mt-8">
            <Button
              onClick={() => setIsUsageFormOpen(true)}
            >
              Access Service
            </Button>
          </div>
        </Tile>
      </Column>

      <ServiceUsageForm
        isOpen={isUsageFormOpen}
        onClose={() => setIsUsageFormOpen(false)}
        service={service}
      />
    </Grid>
  );
};

export default ServiceDetailsPage