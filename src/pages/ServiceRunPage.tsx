import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Grid,
  Column,
  Tile,
  Loading,
  TextArea,
  Stack,
  InlineNotification,
  ProgressBar,
  Button,
} from '@carbon/react';
import { Upload, ArrowLeft, Information } from '@carbon/icons-react';
import { useProjectStore } from '../store/projectStore';
import { useServiceRun } from '../hooks/useServiceRun';
import DocumentList from '../components/documents/DocumentList';
import DocumentUploadModal from '../components/documents/DocumentUploadModal';
import type { Database } from '../types/database.types';

type Service = Database['public']['Tables']['services']['Row'] & {
  usage: {
    total_transactions: number;
    total_tokens: number;
    total_cost: number;
    last_used_at: string | null;
  };
};

const ServiceRunPage: React.FC = () => {
  const { projectId, serviceId } = useParams<{ projectId: string; serviceId: string }>();
  const navigate = useNavigate();
  const { fetchProjectServices, loading, fetchProject } = useProjectStore();
  const [unauthorized, setUnauthorized] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const { isRunning, error, runService, reset } = useServiceRun(serviceId || '', projectId || '');
  const [projectServices, setProjectServices] = useState<Service[]>([]);

  useEffect(() => {
    if (projectId && serviceId) {
      fetchProjectServices(projectId).then(services => {
        setProjectServices(services);
      });
    }
  }, [projectId, serviceId, fetchProjectServices]);

  useEffect(() => {
    if (unauthorized) {
      navigate('/dashboard');
    }
  }, [unauthorized, navigate]);

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
      // Navigate back to service detail page after successful run
      navigate(`/projects/${projectId}/services/${serviceId}`);
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

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loading withOverlay={false} description="Loading service..." />
      </div>
    );
  }


  const service = projectServices.find(s => s.id === serviceId);
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
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <Button
              kind="ghost"
              renderIcon={ArrowLeft}
              onClick={() => navigate(`/projects/${projectId}`)}
              size="sm"
              className="py-1"
            >
              Back to Project
            </Button>
          </div>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">{service.name}</h1>
            <Button
              kind="ghost"
              renderIcon={Information}
              onClick={() => navigate(`/projects/${projectId}/services/${serviceId}`)}
            >
              View Service Usage Details
            </Button>
          </div>
          {service.description && (
            <p className="text-gray-600 mt-2">{service.description}</p>
          )}
        </div>

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
            <Tile className="p-5">
              <h2 className="text-xl font-semibold mb-2">Instructions</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{service.instructions}</p>
            </Tile>
          )}

          <Tile className="p-5">
            <h2 className="text-xl font-semibold mb-4">Input</h2>
            <TextArea
              id="customInput"
              labelText="Provide any additional information needed for the service"
              placeholder="Enter any additional information needed for the service..."
              value={customInput}
              onChange={handleInputChange}
              rows={4}
              invalid={!!inputError && !customInput.trim() && selectedDocumentIds.length === 0}
              invalidText="Input is required if no files are selected"
            />
          </Tile>

          <Tile className="p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Documents</h2>
              <Button
                renderIcon={Upload}
                onClick={() => setIsUploadModalOpen(true)}
              >
                Upload Documents
              </Button>
            </div>
            
            <DocumentList 
              projectId={projectId || ''}
              mode="select"
              selectedIds={selectedDocumentIds}
              onSelectionChange={handleDocumentSelection}
              showUploadButton={false}
            />
          </Tile>

          {isRunning && (
            <ProgressBar
              label="Processing"
              helperText="Running service..."
              value={50}
              max={100}
            />
          )}

          <div className="flex justify-end gap-4">
            <Button
              kind="secondary"
              onClick={() => navigate(`/projects/${projectId}/services/${serviceId}`)}
            >
              Cancel
            </Button>
            <Button
              kind="primary"
              onClick={handleSubmit}
              disabled={isRunning}
            >
              Run Service
            </Button>
          </div>
        </Stack>

        {isUploadModalOpen && (
          <DocumentUploadModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            projectId={projectId || ''}
            onUploadComplete={(uploadedIds) => {
              setIsUploadModalOpen(false);
              setSelectedDocumentIds(uploadedIds);
              // Refresh the document list
              fetchProject(projectId || '');
            }}
          />
        )}
      </Column>
    </Grid>
  );
};

export default ServiceRunPage; 