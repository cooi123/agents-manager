import React, { useState } from 'react';
import {
  Modal,
  TextArea,
  FileUploader,
  Button,
  Stack,
  InlineNotification,
  ProgressBar,
} from '@carbon/react';
import { useServiceUsageStore } from '../../store/serviceUsageStore';
import { usePersonalDocumentStore } from '../../store/personalDocumentStore';
import { supabase } from '../../services/supabase';

interface ServiceUsageFormProps {
  isOpen: boolean;
  onClose: () => void;
  service: {
    id: string;
    name: string;
    instructions: string | null;
  };
}

const ServiceUsageForm: React.FC<ServiceUsageFormProps> = ({ isOpen, onClose, service }) => {
  const [customInput, setCustomInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { createUsageRecord } = useServiceUsageStore();
  const { uploadDocument } = usePersonalDocumentStore();

  const handleSubmit = async () => {
    try {
      setError(null);
      setUploading(true);

      let documentId = null;

      // Upload document if provided
      let uploadedDoc = null;
      if (file) {
        uploadedDoc = await uploadDocument(file);
        if (!uploadedDoc) throw new Error('Failed to upload document');
        documentId = uploadedDoc.id;
      }

      // Make request to service
      const response = await fetch(service.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: customInput,
          documentUrl: uploadedDoc ? await getDocumentUrl(uploadedDoc.path) : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Service request failed');
      }

      const result = await response.json();

      // Create usage record
      const usageRecord = await createUsageRecord(
        service.id,
        documentId,
        customInput || null,
        result
      );

      if (!usageRecord) throw new Error('Failed to create usage record');

      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
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
          onChange={(e) => setCustomInput(e.target.value)}
          rows={4}
        />

        <FileUploader
          labelTitle="Upload Document"
          labelDescription="Max file size: 10MB. Supported file types: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG"
          buttonLabel="Add file"
          accept={['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.png']}
          multiple={false}
          onChange={(e: Event) => {
            const target = e.target as HTMLInputElement;
            if (target.files) {
              setFile(target.files[0]);
            }
          }}
        />

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

async function getDocumentUrl(path: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(path, 3600); // 1 hour expiry

    if (error) throw error;
    return data.signedUrl;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    return null;
  }
}

export default ServiceUsageForm;