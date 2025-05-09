import React, { useState } from 'react';
import {
  Modal,
  TextArea,
  Stack,
  InlineNotification,
  ProgressBar,
  Tabs,
  Tab,
  Button,
  TabList,
  TabPanel,
  TabPanels
} from '@carbon/react';

import DocumentUploadModal from '../documents/DocumentUploadModal';
import DocumentSelector from '../documents/DocumentSelector';
import { useServiceRun } from '../../hooks/useServiceRun';
import type { Database } from '../../types/database.types';
import { useUserStore } from '../../store/userStore';
import DocumentList from '../documents/DocumentList';

type Service = Database['public']['Tables']['services']['Row'];

interface ServiceUsageFormProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service;
  projectId: string;
}

const ServiceUsageForm: React.FC<ServiceUsageFormProps> = ({ isOpen, onClose, service, projectId }) => {
  const [customInput, setCustomInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const { isRunning, error, runService, reset } = useServiceRun(service.id, projectId);

  const validateForm = () => {
    setInputError(null);
    if (!customInput.trim() && selectedDocumentIds.length === 0) {
      setInputError("Please provide either text input or select an existing document");
      return false;
    }
    return true;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      await runService(selectedDocumentIds, customInput);
      onClose();
      setCustomInput('');
      setSelectedDocumentIds([]);
      setInputError(null);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCustomInput(e.target.value);
    if (inputError) setInputError(null);
  };

  const handleDocumentSelection = (selectedIds: string[]) => {
    setSelectedDocumentIds(selectedIds);
    if (inputError && selectedIds.length > 0) setInputError(null);
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
      primaryButtonDisabled={isRunning}
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
          invalid={!!inputError && !customInput.trim() && selectedDocumentIds.length === 0}
          invalidText="Input is required if no files are selected"
        />

        <div className="document-section">
          <DocumentList 
            projectId={projectId}
            mode="select"
            selectedIds={selectedDocumentIds}
            onSelectionChange={handleDocumentSelection}
            showUploadButton={true}
          />
        </div>
        {isRunning && (
          <ProgressBar
            label="Processing"
            helperText="Running service..."
            value={50}
            max={100}
          />
        )}
      </Stack>
    </Modal>
  );
};

export default ServiceUsageForm;