import React, { useState } from 'react';
import { Tile, Button } from '@carbon/react';
import { Play } from '@carbon/icons-react';
import ServiceUsageForm from './ServiceUsageForm';

interface ServiceRunCardProps {
  service: {
    id: string;
    name: string;
    description: string | null;
    instructions?: string | null;
    url?: string;
  };
  projectId: string;
}

const ServiceRunCard: React.FC<ServiceRunCardProps> = ({ service, projectId}) => {
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
  
  return (
    <>
      <Tile className="p-5 h-full flex flex-col">
        <h3 className="text-lg font-semibold mb-3">{service.name}</h3>
        {service.description && (
          <p className="text-gray-600 mb-4 flex-grow">{service.description}</p>
        )}
        <Button
          kind="primary"
          renderIcon={Play}
          onClick={() => setIsUsageModalOpen(true)}
          className="mt-auto"
        >
          Run Service
        </Button>
      </Tile>
      
      {isUsageModalOpen && (
        <ServiceUsageForm 
          isOpen={isUsageModalOpen}
          onClose={() => setIsUsageModalOpen(false)}
          service={service}
          projectId={projectId} // Assuming projectId is the same as service.id for this example
        />
      )}
    </>
  );
};

export default ServiceRunCard;