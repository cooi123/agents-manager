import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Grid, Column, Tile, Loading, Button, Modal } from '@carbon/react';
import { Upload } from '@carbon/icons-react';
import { useProjectStore } from '../store/projectStore';
import { useAuthStore } from '../store/authStore';
import DocumentUploader from '../components/documents/DocumentUploader';
import DocumentList from '../components/documents/DocumentList';
import { formatDate } from '../utils/formatters';

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentProject, loading, fetchProject } = useProjectStore();
  const { user } = useAuthStore();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  
  useEffect(() => {
    if (id && user) {
      fetchProject(id).then(project => {
        if (!project || project.user_id !== user.id) {
          setUnauthorized(true);
        }
      });
    }
  }, [id, user, fetchProject]);
  
  useEffect(() => {
    if (unauthorized) {
      navigate('/dashboard');
    }
  }, [unauthorized, navigate]);
  
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

        <Modal
          open={isUploadModalOpen}
          onRequestClose={() => setIsUploadModalOpen(false)}
          modalHeading="Upload Documents"
          primaryButtonText="Close"
          size="lg"
        >
          <DocumentUploader projectId={currentProject.id} />
        </Modal>
      </Column>
    </Grid>
  );
};

export default ProjectDetailPage;