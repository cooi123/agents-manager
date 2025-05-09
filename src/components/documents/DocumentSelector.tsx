import React, { useEffect, useState } from 'react';
import {
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Loading,
  Tag,
  Button,
  Checkbox
} from '@carbon/react';
import { View, Download } from '@carbon/icons-react';
import { useDocumentStore } from '../../store/documentStore';
import { formatDate, formatFileSize } from '../../utils/formatters';
import DocumentViewer from './DocumentViewer';

interface DocumentSelectorProps {
  projectId: string;
  onSelectionChange: (selectedIds: string[]) => void;
  selectedIds: string[];
  onUploadClick?: () => void;
}

const DocumentSelector: React.FC<DocumentSelectorProps> = ({
  projectId,
  onSelectionChange,
  selectedIds,
  onUploadClick
}) => {
  const { projectDocuments: documents, loading, fetchDocuments } = useDocumentStore();
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  useEffect(() => {
    fetchDocuments(projectId);
  }, [fetchDocuments, projectId]);

  const headers = [
    { key: 'select', header: 'Select' },
    { key: 'filename', header: 'Filename' },
    { key: 'filesize', header: 'Size' },
    { key: 'created_at', header: 'Uploaded' },
    { key: 'actions', header: 'Actions' },
  ];

  const rows = documents.map((doc) => ({
    id: doc.id,
    filename: doc.filename,
    filesize: formatFileSize(doc.filesize),
    created_at: formatDate(doc.created_at),
    path: doc.path,
  }));

  const handleDownload = async (path: string, filename: string) => {
    try {
      const { data, error } = await window.supabase.storage
        .from('documents')
        .download(path);
      
      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Tag type="cool-gray">No Documents</Tag>
        <p className="mt-4">Upload documents to this project</p>
        {onUploadClick && (
          <Button 
            kind="secondary"
            onClick={onUploadClick}
            className="mt-4"
          >
            Upload Documents
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        {onUploadClick && (
          <Button 
            kind="secondary"
            onClick={onUploadClick}
          >
            Upload Documents
          </Button>
        )}
      </div>

      <DataTable rows={rows} headers={headers}>
        {/* ... existing DataTable content ... */}
      </DataTable>

      {isViewerOpen && selectedDocument && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center">
          <DocumentViewer
            isOpen={isViewerOpen}
            onClose={() => {
              setIsViewerOpen(false);
              setSelectedDocument(null);
            }}
            document={selectedDocument}
          />
        </div>
      )}
    </>
  );
};

export default DocumentSelector;