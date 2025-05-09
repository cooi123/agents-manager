import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Tile, Tag } from '@carbon/react';
import { Play, ChartLine } from '@carbon/icons-react';
import type { Database } from '../../types/database.types';

type Service = Database['public']['Tables']['services']['Row'] & {
  usage: {
    total_transactions: number;
    total_tokens: number;
    total_cost: number;
    last_used_at: string | null;
  };
};

interface ServiceRunCardProps {
  service: Service;
  projectId: string;
}

const ServiceRunCard: React.FC<ServiceRunCardProps> = ({ service, projectId }) => {
  const navigate = useNavigate();

  const handleRunService = () => {
    navigate(`/projects/${projectId}/services/${service.id}/run`);
  };

  const handleViewDetails = () => {
    navigate(`/projects/${projectId}/services/${service.id}`);
  };

  return (
    <Tile className="h-full flex flex-col">
      <div className="flex-grow">
        <h3 className="text-lg font-semibold">{service.name}</h3>
        {service.description && (
          <p className="text-sm text-gray-600 mt-1">{service.description}</p>
        )}
        
        <div className="space-y-2 mt-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Transactions</span>
            <Tag type="blue">{service.usage.total_transactions}</Tag>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Tokens</span>
            <Tag type="purple">{service.usage.total_tokens.toLocaleString()}</Tag>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Cost</span>
            <Tag type="warm-gray">${service.usage.total_cost.toFixed(2)}</Tag>
          </div>
          {service.usage.last_used_at && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Last Used</span>
              <span className="text-sm">
                {new Date(service.usage.last_used_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between mt-4">
        <button
          className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          onClick={handleRunService}
        >
          <Play className="mr-2" size={16} />
          Run Service
        </button>
        <button
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          onClick={handleViewDetails}
        >
          <ChartLine className="mr-2" size={16} />
          View Details
        </button>
      </div>
    </Tile>
  );
};

export default ServiceRunCard;