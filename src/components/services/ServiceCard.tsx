import React from 'react';
import { Tile, Button } from '@carbon/react';
import { ArrowRight } from '@carbon/icons-react';
import { useNavigate } from 'react-router-dom';

interface ServiceCardProps {
  service: {
    id: string;
    name: string;
    description: string | null;
  };
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service }) => {
  const navigate = useNavigate();
  
  return (
    <Tile className="p-5 h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-3">{service.name}</h3>
      {service.description && (
        <p className="text-gray-600 mb-4 flex-grow">{service.description}</p>
      )}
      <Button
        kind="ghost"
        renderIcon={ArrowRight}
        onClick={() => navigate(`/services/${service.id}`)}
        className="mt-auto"
      >
        View Details
      </Button>
    </Tile>
  );
};

export default ServiceCard;