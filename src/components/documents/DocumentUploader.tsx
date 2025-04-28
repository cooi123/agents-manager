import React, { useState } from 'react';
import {
  FileUploader,
  InlineNotification,
  Button,
  Stack,
  ProgressBar,
} from '@carbon/react';
import { useDocumentStore } from '../../store/documentStore';
import { useAuthStore } from '../../store/authStore';

type DocumentUploaderProps = {
  projectId: string;
};

const DocumentUploader: React.FC<DocumentUploaderProps> = ({ projectId }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploadingStatus, setUploadingStatus] = useState<'uploading' | 'complete' | 'edit' | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const { uploadDocument } = useDocumentStore();
  const { user } = useAuthStore();
  
  const handleUpload = async () => {
    if (!user || !files.length) return;
    
    setError(null);
    setUploadingStatus('uploading');
    setUploadProgress(0);
    
    try {
      const totalFiles = files.length;
      let completedFiles = 0;
      
      const results = [];
      for (const file of files) {
        const result = await uploadDocument(file, projectId);
        results.push(result);
        completedFiles++;
        setUploadProgress((completedFiles / totalFiles) * 100);
      }
      
      if (results.every(result => result !== null)) {
        setUploadingStatus('complete');
        setFiles([]);
        setUploadProgress(0);
        setTimeout(() => {
          setUploadingStatus('edit');
        }, 2000);
      } else {
        setError('Some files failed to upload');
        setUploadingStatus('edit');
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      setUploadingStatus('edit');
      setUploadProgress(0);
    }
  };

  return (
    <Stack gap={5}>
      {error && (
        <InlineNotification
          kind="error"
          title="Error"
          subtitle={error}
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
          helperText="Uploading files..."
          value={uploadProgress}
          max={100}
        />
      )}
      
      <FileUploader
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
      
      {files.length > 0 && (
        <Button
          onClick={handleUpload}
          disabled={uploadingStatus === 'uploading'}
        >
          {uploadingStatus === 'uploading' ? 'Uploading...' : 'Upload files'}
        </Button>
      )}
    </Stack>
  );
};

export default DocumentUploader;