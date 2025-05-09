import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid, Column, Tile, Loading, Button } from '@carbon/react';
import { Upload, AddAlt } from '@carbon/icons-react';
import { useProjectStore } from '../../store/projectStore';
import { useDocumentStore } from '../../store/documentStore';
import DocumentList from '../../components/documents/DocumentList';
import ServiceSelector from '../../components/services/ServiceSelector';
import ServiceRunCard from '../../components/services/ServiceRunCard';
import DocumentUploadModal from '../../components/documents/DocumentUploadModal';

const PersonalProjectPage: React.FC = () => {
  const { loading, personalProject,fetchPersonalProject } = useProjectStore();
  const { projectDocuments: documents, fetchDocuments } = useDocumentStore();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isServiceSelectorOpen, setIsServiceSelectorOpen] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      await fetchPersonalProject();
      if (personalProject) {
        await fetchDocuments(personalProject.id);
      }
    };
    initialize();
  }, []);

  if (loading || !personalProject) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loading withOverlay={false} description="Loading documents..." />
      </div>
    );
  }


  return (
    <Grid fullWidth className="p-5">
      <Column lg={16} md={8} sm={4}>
        <div className="mb-6">
          <h1 className="text-3xl font-bold">My Personal Project</h1>
          <p className="text-gray-600">Manage your personal documents and services</p>
        </div>

        {/* Services Section */}
        <div className="flex justify-between items-center mb-4 mt-8">
          <h2 className="text-xl font-semibold">My Services</h2>
          <Button
            renderIcon={AddAlt}
            onClick={() => setIsServiceSelectorOpen(true)}
          >
            Add Service
          </Button>
        </div>
        
        {personalProject.services && personalProject.services.length > 0 ? (
          <Grid fullWidth className="mb-8">
            {personalProject.services.map(service => (
              <Column key={service.id} lg={4} md={4} sm={4} className="mb-4">
                <ServiceRunCard service={service} projectId={personalProject.id} />
              </Column>
            ))}
          </Grid>
        ) : (
          <Tile className="p-5 mb-8">
            <p className="text-center text-gray-600 py-4">
              No services added yet.
              Click "Add Service" to get started.
            </p>
          </Tile>
        )}

        {/* Documents Section */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">My Documents</h2>
          <Button
            renderIcon={Upload}
            onClick={() => setIsUploadModalOpen(true)}
          >
            Upload Documents
          </Button>
        </div>
        
        <Tile className="p-5">
          <DocumentList projectId={personalProject.id} />
        </Tile>

        {isServiceSelectorOpen && (
          <ServiceSelector 
            projectId={personalProject.id}
            open={isServiceSelectorOpen}
            onClose={() => setIsServiceSelectorOpen(false)}
          />
        )}

        {isUploadModalOpen && (
          <DocumentUploadModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            projectId={personalProject.id}
            onUploadComplete={() => {
              setIsUploadModalOpen(false);
              fetchDocuments(personalProject.id);
            }}
          />
        )}
      </Column>
    </Grid>
  );
};

export default PersonalProjectPage;