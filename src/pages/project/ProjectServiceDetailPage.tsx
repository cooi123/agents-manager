import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Grid, Column, Tile, Loading, Button } from '@carbon/react';
import { ChevronLeft } from '@carbon/icons-react';
import { useProjectStore } from '../../store/projectStore';
import ServiceUsageList from '../../components/services/ServiceUsageList';

const ProjectServiceDetailPage: React.FC = () => {
  const { projectId, serviceId } = useParams<{ projectId: string; serviceId: string }>();
  const navigate = useNavigate();
  const { currentProject, loading, fetchProject } = useProjectStore();
  const [unauthorized, setUnauthorized] = useState(false);
  useEffect(() => {
    if (projectId && serviceId) {
      fetchProject(projectId).then(project => {
        if (!project) {
          setUnauthorized(true);
        }
      });
    }
  }, [projectId, serviceId, fetchProject]);

  useEffect(() => {
    if (unauthorized) {
      navigate('/dashboard');
    }
  }, [unauthorized, navigate]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loading withOverlay={false} description="Loading service details..." />
      </div>
    );
  }

  if (!currentProject) {
    return null;
  }

  const service = currentProject.services.find(s => s.id === serviceId);
  if (!service) {
    return (
      <div className="p-5">
        <Tile>
          <p className="text-center text-gray-600">Service not found</p>
        </Tile>
      </div>
    );
  }

  return (
    <Grid fullWidth className="p-5">
      <Column lg={16} md={8} sm={4}>
        <div className="mb-4">
          <Button kind="ghost" size="sm" renderIcon={ChevronLeft} iconDescription="Back to services" onClick={() => navigate(-1)}>
            Back to service          </Button>
        </div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{service.name}</h1>
          {service.description && (
            <p className="text-gray-600 mt-2">{service.description}</p>
          )}
          
        </div>

        <Tile className="p-5">
          <h2 className="text-xl font-semibold mb-4">Usage History</h2>
          <ServiceUsageList projectId={projectId} serviceId={serviceId} />
        </Tile>
      </Column>
    </Grid>
  );
};

export default ProjectServiceDetailPage; 