import React, { useState, useRef } from 'react';
import {
  Modal,
  FileUploader,
  InlineNotification,
  Stack,
  ProgressBar,
} from '@carbon/react';
import { useDocumentStore } from '../../store/documentStore';
import { useAuthStore } from '../../store/authStore';
import { FileUploaderHandle } from '@carbon/react/lib/components/FileUploader/FileUploader';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onUploadComplete?: () => void;
}

const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  projectId,
  onUploadComplete
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploadingStatus, setUploadingStatus] = useState<'uploading' | 'complete' | 'edit' | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const fileInputRef= useRef<FileUploaderHandle>(null);
  const { uploadDocuments } = useDocumentStore();
  const { user } = useAuthStore();

  const resetFileUploader = () => {
    setFiles([]);
    setError(null);
    setUploadErrors([]);
    setUploadingStatus(null);
    setUploadProgress(0);
    fileInputRef.current?.clearFiles()
  };

  const handleUpload = async () => {
    if (!user || !files.length) return false;
    
    setError(null);
    setUploadErrors([]);
    setUploadingStatus('uploading');
    setUploadProgress(0);
    
    try {
      const result = await uploadDocuments(files, projectId);
      
      if (result.success) {
        setUploadingStatus('complete');
        resetFileUploader();
        if (onUploadComplete) {
          setTimeout(() => {
            onUploadComplete();
          }, 1000);
        }
        return true;
      } else {
        if (result.errors) {
          setUploadErrors(result.errors);
        }
        setUploadingStatus('edit');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      setUploadingStatus('edit');
      setUploadProgress(0);
      return false;
    }
  };

  const handlePrimarySubmit = async () => {
    const success = await handleUpload();
    if (success) {
      onClose();
    }
  };

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      resetFileUploader();
    }
  }, [isOpen]);

  return (
    <Modal
      open={isOpen}
      onRequestClose={onClose}
      modalHeading="Upload Documents"
      primaryButtonText="Upload"
      secondaryButtonText="Cancel"
      size="lg"
      primaryButtonDisabled={!files.length}
      onRequestSubmit={handlePrimarySubmit}
    >
      <Stack gap={5}>
        {error && (
          <InlineNotification
            kind="error"
            title="Error"
            subtitle={error}
            hideCloseButton
          />
        )}
        
        {uploadErrors.length > 0 && (
          <InlineNotification
            kind="error"
            title="Upload Issues"
            subtitle={uploadErrors.map((err, index) => (
              <li key={index} style={{ margin: 0, paddingLeft: '1rem' }}>{err}</li>
            )).join('\n')}
             
            
            hideCloseButton
          />
        )}
        
        {uploadingStatus === 'complete' && (
          <InlineNotification
            kind="success"
            title="Success"
            subtitle="Documents uploaded successfully"
            hideCloseButton
          />
        )}
        
        {uploadingStatus === 'uploading' && (
          <ProgressBar
            label="Upload Progress"
            helperText="Uploading files..."
            value={uploadProgress}
            max={100}
          />
        )}
        
        <FileUploader
          ref={fileInputRef}
          labelTitle="Upload documents"
          labelDescription="Max file size: 10MB. Supported file types: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG"
          buttonLabel="Add files"
          filenameStatus={uploadingStatus || 'edit'}
          accept={['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.png']}
          multiple
          onChange={(e: Event) => {
            const target = e.target as HTMLInputElement;
            if (target.files) {
              setFiles(Array.from(target.files));
            }
          }}
        />
      </Stack>
    </Modal>
  );
};

export default DocumentUploadModal; 