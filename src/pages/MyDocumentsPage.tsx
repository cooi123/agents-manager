import React, { useEffect, useState } from 'react';
import { Grid, Column, Tile, Button } from '@carbon/react';
import { Upload } from '@carbon/icons-react';
import { useProjectStore } from '../store/projectStore';
import { useDocumentStore } from '../store/documentStore';
import DocumentList from '../components/documents/DocumentList';
import DocumentUploadModal from '../components/documents/DocumentUploadModal';

const MyDocumentsPage: React.FC = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const { personalProject, fetchPersonalProject } = useProjectStore();
  const { fetchDocuments } = useDocumentStore();

  useEffect(() => {
    const initialize = async () => {
      const project = await fetchPersonalProject();
      if (project) {
        await fetchDocuments(project.id);
      }
    };
    
    initialize();
  }, []); // Empty dependency array since we only want to run this once on mount
  
  return (
    <Grid fullWidth className="p-5">
      <Column lg={16} md={8} sm={4}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Documents</h1>
          <Button
            renderIcon={Upload}
            onClick={() => setIsUploadModalOpen(true)}
          >
            Upload Documents
          </Button>
        </div>
        
        <Tile className="p-5">
          {personalProject && <DocumentList projectId={personalProject.id} />}
        </Tile>
        
        {personalProject && (
          <DocumentUploadModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            projectId={personalProject.id}
          />
        )}
      </Column>
    </Grid>
  );
};

export default MyDocumentsPage;