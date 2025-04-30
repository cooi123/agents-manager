import React, { useEffect, useState } from 'react';
import { Grid, Column, Tile, Button, Modal } from '@carbon/react';
import { Upload } from '@carbon/icons-react';
import PersonalDocumentList from '../components/documents/PersonalDocumentList';
import PersonalDocumentUploader from '../components/documents/PersonalDocumentUploader';

const MyDocumentsPage: React.FC = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
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
          <PersonalDocumentList />
        </Tile>
        
        <Modal
          open={isUploadModalOpen}
          onRequestClose={() => setIsUploadModalOpen(false)}
          modalHeading="Upload Documents"
          primaryButtonText="Close"
          size="lg"
        >
          <PersonalDocumentUploader />
        </Modal>
      </Column>
    </Grid>
  );
};

export default MyDocumentsPage;