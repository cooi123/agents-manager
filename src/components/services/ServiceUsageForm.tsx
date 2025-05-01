import React, { useState } from 'react';
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
import { usePersonalDocumentStore } from '../../store/personalDocumentStore';
import { supabase } from '../../services/supabase';
import DocumentSelector from '../documents/DocumentSelector';
import { useDocumentStore } from '../../store/documentStore';

interface ServiceUsageFormProps {
  isOpen: boolean;
  onClose: () => void;
  service: {
    id: string;
    name: string;
    instructions: string | null;
  };
  projectId?: string;
}
const SERVICE_URL = import.meta.env.VITE_SERVICE_BROKER_URL || 'http://localhost:8000/run/service';
const ServiceUsageForm: React.FC<ServiceUsageFormProps> = ({ isOpen, onClose, service ,projectId}) => {
  const [customInput, setCustomInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { createUsageRecord } = useServiceUsageStore();
  const { uploadDocument:uploadPersonalDocs} = usePersonalDocumentStore();
  const { uploadDocument:uploadProjectDocs} = useDocumentStore();
  const [inputError, setInputError] = useState<string | null>(null);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const isPersonalDocument = projectId ? false : true;
  
  // Get the user ID when component mounts
  React.useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      console.log('User data:', data);
      if (data.user) {
        setUserId(data.user.id);
      }
    };
    getUser();
  }, []);
  
  const validateForm = () => {
    // Clear previous errors
    setInputError(null);

    // Check if input is empty and no files are uploaded and no documents are selected
    if (!customInput.trim() && (!files || files.length === 0) && selectedDocumentIds.length === 0) {
      setInputError("Please provide either text input, upload a document, or select an existing document");
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async () => {
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    try {
      setError(null);
      setUploading(true);

      let documentIds = [...selectedDocumentIds]; // Start with selected existing documents
      let documentUrls = [];
      if (!projectId) {
        // Upload new personal documents if provided
        for (const file of files) {
          const uploadedDoc = await uploadPersonalDocs(file);
          if (!uploadedDoc || !uploadedDoc.path) {
            throw new Error(`Failed to upload document: ${file.name}`);
          }

          documentIds.push(uploadedDoc.id);

          // Get signed URL for the document
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from('personal_documents')
            .createSignedUrl(uploadedDoc.path, 3600);

          if (signedUrlError) throw signedUrlError;
          documentUrls.push(signedUrlData.signedUrl);
        }
      }
      else{
        // Upload new documents if provided
        for (const file of files) {
          const uploadedDoc = await uploadProjectDocs(file, projectId);
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
      }

      let selectedDocs: { path: string }[] = [];

      // Get signed URLs for existing documents
      if (selectedDocumentIds.length > 0) {
        // Fetch paths for selected documents
        if (isPersonalDocument) {
          const { data, error: fetchError } = await supabase
            .from('personal_documents')
            .select('path')
            .in('id', selectedDocumentIds);
          if (fetchError) throw fetchError;
          selectedDocs = data || [];
        }
        else {
          const { data, error: fetchError } = await supabase
            .from('documents')
            .select('path')
            .in('id', selectedDocumentIds);
          if (fetchError) throw fetchError;
          selectedDocs = data || [];
        }
        console.log('Selected documents:', selectedDocs);

        // Get signed URLs for each document
        for (const doc of selectedDocs) {
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from('documents')
            .createSignedUrl(doc.path, 3600);

          if (signedUrlError) throw signedUrlError;
          documentUrls.push(signedUrlData.signedUrl);
        }
      }

      // Prepare request payload with arrays for document IDs and URLs
      const payload = {
        serviceId: service.id,
        userId: userId,
        documentIds: documentIds,
        customInput: customInput,
        documentUrls: documentUrls,
        serviceUrl: service.url,
        projectId: projectId
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

  // Clear errors when input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCustomInput(e.target.value);
    if (inputError) {
      setInputError(null);
    }
  };

  // Clear errors when files change
  const handleFileChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.files) {
      setFiles(Array.from(target.files));
      if (inputError) {
        setInputError(null);
      }
    }
  };

  // Handle document selection
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
            <FileUploader
              labelTitle="Upload Document"
              labelDescription="Max file size: 10MB. Supported file types: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG"
              buttonLabel="Add file"
              accept={['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.png']}
              multiple={true}
              filenameStatus="edit"
              onChange={handleFileChange}
            />
          </Tab>
          <Tab id="select-existing" label="Select Existing Files">
            {projectId ? (
              <DocumentSelector 
              
                projectId={projectId}
                onSelectionChange={handleDocumentSelection} 
              />
            ):(
              <DocumentSelector 
              userId={userId}
                onSelectionChange={handleDocumentSelection} 
              />
            )}
          </Tab>
        </Tabs>

        {uploading && (
          <ProgressBar
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