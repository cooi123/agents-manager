import React, { useState } from 'react';
import { Grid, Column, Tile, Button } from '@carbon/react';
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
        
        {isUploadModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
              <h2 className="text-2xl font-bold mb-6">Upload Documents</h2>
              <PersonalDocumentUploader />
              <Button
                kind="secondary"
                className="mt-6"
                onClick={() => setIsUploadModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Column>
    </Grid>
  );
};

export default MyDocumentsPage