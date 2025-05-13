import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Grid, Column, Tile, Loading, Button, Modal } from '@carbon/react';
import { Upload, AddAlt } from '@carbon/icons-react';
import { useProjectStore } from '../../store/projectStore';
import { useAuthStore } from '../../store/authStore';
import DocumentList from '../../components/documents/DocumentList';
import ServiceSelector from '../../components/services/ServiceSelector';
import { formatDate } from '../../utils/formatters';
import ServiceRunCard from '../../components/services/ServiceRunCard';
import DocumentUploadModal from '../../components/documents/DocumentUploadModal';

const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { currentProject, loading, fetchProject } = useProjectStore();
  const { user } = useAuthStore();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isServiceSelectorOpen, setIsServiceSelectorOpen] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  
  useEffect(() => {
    if (projectId && user) {
      fetchProject(projectId).then(project => {
        if (!project || project.user_id !== user.id) {
          setUnauthorized(true);
        }
      });
    }
  }, [projectId, user, fetchProject]);
  
  useEffect(() => {
    if (unauthorized) {
      navigate('/dashboard');
    }
  }, [unauthorized, navigate]);
  
  useEffect(() => {
    return () => {
      setIsUploadModalOpen(false);
      setIsServiceSelectorOpen(false);
    };
  }, []);
  
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loading withOverlay={false} description="Loading project..." />
      </div>
    );
  }
  
  if (!currentProject) {
    return null;
  }
  
  return (
    <Grid fullWidth className="p-5">
      <Column lg={16} md={8} sm={4}>
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{currentProject.name}</h1>
          <p className="text-gray-600">Created on {formatDate(currentProject.created_at)}</p>
        </div>
        
        {currentProject.description && (
          <Tile className="p-5 mb-5">
            <h2 className="text-xl font-semibold mb-2">Description</h2>
            <p>{currentProject.description}</p>
          </Tile>
        )}

        {/* Services Section */}
        <div className="flex justify-between items-center mb-4 mt-8">
          <h2 className="text-xl font-semibold">Project Services</h2>
          <Button
            renderIcon={AddAlt}
            onClick={() => setIsServiceSelectorOpen(true)}
          >
            Add Service
          </Button>
        </div>
        
        {currentProject.services && currentProject.services.length > 0 ? (
          <Grid fullWidth className="mb-8">
            {currentProject.services.map(service => (
              <Column key={service.id} lg={4} md={4} sm={4} className="mb-4">
                <ServiceRunCard service={service} projectId={currentProject.id} />
              </Column>
            ))}
          </Grid>
        ) : (
          <Tile className="p-5 mb-8">
            <p className="text-center text-gray-600 py-4">
              No services assigned to this project yet.
              Click "Manage Services" to add services.
            </p>
          </Tile>
        )}

        {/* Documents Section */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Project Documents</h2>
          <Button
            renderIcon={Upload}
            onClick={() => setIsUploadModalOpen(true)}
          >
            Upload Documents
          </Button>
        </div>
        
        <Tile className="p-5">
          <DocumentList projectId={currentProject.id} />
        </Tile>

        {isServiceSelectorOpen && (
          <ServiceSelector 
            projectId={currentProject.id}
            open={isServiceSelectorOpen}
            onClose={() => setIsServiceSelectorOpen(false)}
          />
        )}

        {isUploadModalOpen && (
          <DocumentUploadModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            projectId={currentProject.id}
            onUploadComplete={() => {
              setIsUploadModalOpen(false);
            }}
          />
        )}
      </Column>
    </Grid>
  );
};

export default ProjectDetailPage;