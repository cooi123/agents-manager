import React, { useState, useEffect } from 'react';
import {
  Modal,
  TextArea,
  FileUploader,
  Button,
  Stack,
  InlineNotification,
  ProgressBar,
  Tabs, Tab
} from '@carbon/react';
import { useServiceUsageStore } from '../../store/serviceUsageStore';
import { useDocumentStore } from '../../store/documentStore';
import { useProjectStore } from '../../store/projectStore';
import { useAuthStore } from '../../store/authStore';
import DocumentSelector from '../documents/DocumentSelector';
import { supabase } from '../../services/supabase';

interface ServiceUsageFormProps {
  isOpen: boolean;
  onClose: () => void;
  service: {
    id: string;
    name: string;
    instructions: string | null;
    url: string;
  };
  projectId?: string;
}

const SERVICE_URL = import.meta.env.VITE_SERVICE_BROKER_URL;

const ServiceUsageForm: React.FC<ServiceUsageFormProps> = ({ isOpen, onClose, service, projectId }) => {
  const [customInput, setCustomInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { createUsageRecord } = useServiceUsageStore();
  const { uploadDocument } = useDocumentStore();
  const { user } = useAuthStore();
  const { projects, fetchProjects } = useProjectStore();
  const [inputError, setInputError] = useState<string | null>(null);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  
  // Get the personal project when component mounts
  useEffect(() => {
    const initialize = async () => {
      await fetchProjects();
    };
    initialize();
  }, [fetchProjects]);

  const getProjectId = () => {
    if (projectId) return projectId;
    const personalProject = projects.find(p => p.project_type === 'personal');
    return personalProject?.id;
  };
  
  const validateForm = () => {
    setInputError(null);

    if (!customInput.trim() && (!files || files.length === 0) && selectedDocumentIds.length === 0) {
      setInputError("Please provide either text input, upload a document, or select an existing document");
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      setError(null);
      setUploading(true);

      const currentProjectId = getProjectId();
      if (!currentProjectId) {
        throw new Error('No project found');
      }

      let documentIds = [...selectedDocumentIds];
      let documentUrls = [];

      // Upload new documents if provided
      for (const file of files) {
        const uploadedDoc = await uploadDocument(file, currentProjectId);
        if (!uploadedDoc || !uploadedDoc.path) {
          throw new Error(`Failed to upload document: ${file.name}`);
        }

        documentIds.push(uploadedDoc.id);

        // Get signed URL for the document
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('documents')
          .createSignedUrl(uploadedDoc.path, 3600);

        if (signedUrlError) throw signedUrlError;
        documentUrls.push(signedUrlData.signedUrl);
      }

      // Get signed URLs for existing documents
      if (selectedDocumentIds.length > 0) {
        const { data: selectedDocs, error: fetchError } = await supabase
          .from('documents')
          .select('path')
          .in('id', selectedDocumentIds);

        if (fetchError) throw fetchError;

        for (const doc of selectedDocs) {
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from('documents')
            .createSignedUrl(doc.path, 3600);

          if (signedUrlError) throw signedUrlError;
          documentUrls.push(signedUrlData.signedUrl);
        }
      }

      // Prepare request payload
      const payload = {
        serviceId: service.id,
        userId: user?.id,
        documentIds: documentIds,
        customInput: customInput,
        documentUrls: documentUrls,
        serviceUrl: service.url,
        projectId: currentProjectId
      };

      // Make request to the consultant service
      const response = await fetch(SERVICE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Service request failed');
      }

      const result = await response.json();
      onClose();
      setCustomInput('');
      setFiles([]);
      setSelectedDocumentIds([]);
      setInputError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCustomInput(e.target.value);
    if (inputError) {
      setInputError(null);
    }
  };

  const handleFileChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.files) {
      setFiles(Array.from(target.files));
      if (inputError) {
        setInputError(null);
      }
    }
  };

  const handleDocumentSelection = (selectedIds: string[]) => {
    setSelectedDocumentIds(selectedIds);
    if (inputError && selectedIds.length > 0) {
      setInputError(null);
    }
  };

  return (
    <Modal
      open={isOpen}
      onRequestClose={onClose}
      modalHeading={`Use ${service.name}`}
      primaryButtonText="Submit"
      secondaryButtonText="Cancel"
      onRequestSubmit={handleSubmit}
      size="lg"
    >
      <Stack gap={7}>
        {error && (
          <InlineNotification
            kind="error"
            title="Error"
            subtitle={error}
            hideCloseButton
          />
        )}
        
        {inputError && (
          <InlineNotification
            kind="error"
            title="Validation Error"
            subtitle={inputError}
            hideCloseButton
          />
        )}

        {service.instructions && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2">Instructions</h3>
            <p className="text-gray-600">{service.instructions}</p>
          </div>
        )}

        <TextArea
          id="customInput"
          labelText="Additional Information"
          placeholder="Enter any additional information needed for the service..."
          value={customInput}
          onChange={handleInputChange}
          rows={4}
          invalid={!!inputError && !customInput.trim() && files.length === 0 && selectedDocumentIds.length === 0}
          invalidText="Input is required if no files are uploaded or selected"
        />

        <Tabs>
          <Tab id="upload-new" label="Upload New Files">
            {/* <FileUploader
              labelTitle="Upload Document"
              labelDescription="Max file size: 10MB. Supported file types: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG"
              buttonLabel="Add file"
              accept={['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.png']}
              multiple={true}
              filenameStatus="edit"
              onChange={handleFileChange} */}
              <div></div>
            
          </Tab>
          <Tab id="select-existing" label="Select Existing Files">
            <DocumentSelector 
              projectId={getProjectId()}
              onSelectionChange={handleDocumentSelection} 
            />
          </Tab>
        </Tabs>

        {uploading && (
          <ProgressBar
            label="Processing"
            helperText="Processing..."
            value={50}
            max={100}
          />
        )}
      </Stack>
    </Modal>
  );
}

export default ServiceUsageForm;