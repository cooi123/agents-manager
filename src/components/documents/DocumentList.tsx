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
  Checkbox,
  InlineNotification
} from '@carbon/react';
import { View, Download, List, TrashCan, Upload } from '@carbon/icons-react';
import { useDocumentStore } from '../../store/documentStore';
import { formatDate, formatFileSize } from '../../utils/formatters';
import DocumentViewer from './DocumentViewer';
import DocumentUploadModal from './DocumentUploadModal';
import { useNavigate } from 'react-router-dom';
import { handleDownload } from '../../utils/fileUtil';

interface DocumentListProps {
  projectId: string;
  mode?: 'select' | 'view';
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  showUploadButton?: boolean;
}

const DocumentList: React.FC<DocumentListProps> = ({
  projectId,
  mode = 'view',
  selectedIds = [],
  onSelectionChange,
  showUploadButton = false,
}) => {
  const { projectDocuments: documents, loading, fetchDocuments, deleteDocument } = useDocumentStore();
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments(projectId);
  }, [fetchDocuments, projectId]);

  // Add cleanup effect
  useEffect(() => {
    return () => {
      setIsViewerOpen(false);
      setIsUploadModalOpen(false);
      setSelectedDocument(null);
    };
  }, []);

  const headers = [
    ...(mode === 'select' ? [{ key: 'select', header: 'Select' }] : []),
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
  


  if (loading) {
    return <Loading />;
  }
  
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Tag type="cool-gray">No Documents</Tag>
        <p className="mt-4">Upload documents to this project</p>
        {showUploadButton && (
          <Button 
            kind="secondary"
            renderIcon={Upload}
            onClick={() => setIsUploadModalOpen(true)}
            className="mt-4"
          >
            Upload Documents
          </Button>
        )}
        {isUploadModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center">
            <DocumentUploadModal
              isOpen={isUploadModalOpen}
              onClose={() => setIsUploadModalOpen(false)}
              projectId={projectId}
              onUploadComplete={(uploadedIds) => {
                setIsUploadModalOpen(false);
                fetchDocuments(projectId);
                if (onSelectionChange) {
                  onSelectionChange([...selectedIds, ...uploadedIds]);
                }
              }}
            />
          </div>
        )}
      </div>
    );
  }
  
  return (
    <>
      {deleteError && (
        <InlineNotification
          kind="error"
          title="Error"
          subtitle={deleteError}
          onClose={() => setDeleteError(null)}
          className="mb-4"
        />
      )}
      
      <div className="flex justify-end mb-4">
        {showUploadButton && (
          <Button
            kind="secondary"
            renderIcon={Upload}
            onClick={() => setIsUploadModalOpen(true)}
          >
            Upload Documents
          </Button>
        )}
      </div>

      <DataTable rows={rows} headers={headers}>
        {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
          <Table {...getTableProps()}>
            <TableHead>
              <TableRow>
                {headers.map((header) => (
                  <TableHeader {...getHeaderProps({ header })}>
                    {header.header}
                  </TableHeader>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow {...getRowProps({ row })}>
                  {row.cells.map((cell) => (
                    <TableCell>
                      {cell.info.header === 'select' ? (
                        <Checkbox
                          labelText="Select"
                          id={`select-${row.id}`}
                          checked={selectedIds.includes(row.id)}
                          onChange={(_, { checked }) => {
                            if (onSelectionChange) {
                              const newSelectedIds = checked
                                ? [...selectedIds, row.id]
                                : selectedIds.filter(id => id !== row.id);
                              onSelectionChange(newSelectedIds);
                            }
                          }}
                        />
                      ) : cell.info.header === 'actions' ? (
                        <div className="flex gap-2">
                          <Button
                            kind="tertiary"
                            size="sm"
                            renderIcon={View}
                            iconDescription="View"
                            onClick={() => {
                              const doc = documents.find(d => d.id === row.id);
                              if (doc) {
                                setSelectedDocument(doc);
                                setIsViewerOpen(true);
                              }
                            }}
                          >
                            Quick View
                          </Button>
                          {mode === 'view' && (
                            <>
                              <Button
                                kind="ghost"
                                size="sm"
                                renderIcon={List}
                                iconDescription="Details"
                                onClick={() => {
                                  navigate(`/projects/${projectId}/documents/${row.id}`);
                                }}
                              >
                                Details
                              </Button>
                              <Button
                                kind="ghost"
                                size="sm"
                                renderIcon={Download}
                                iconDescription="Download"
                                onClick={() => {
                                  const doc = documents.find(d => d.id === row.id);
                                  if (doc) {
                                    handleDownload(doc.path, doc.filename);
                                  }
                                }}
                              >
                                Download
                              </Button>
                              <Button
                                kind="danger--ghost"
                                size="sm"
                                renderIcon={TrashCan}
                                iconDescription="Delete"
                                onClick={() => deleteDocument(row.id)}
                              >
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      ) : (
                        cell.value
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DataTable>

      {isViewerOpen && selectedDocument && (
        <div className="z-[9999] bg-black/50 flex items-center justify-center">
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

      {isUploadModalOpen && (
        <div className="bg-black/50 flex items-center justify-center">
          <DocumentUploadModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            projectId={projectId}
            onUploadComplete={(uploadedIds) => {
              setIsUploadModalOpen(false);
              fetchDocuments(projectId);
              if (onSelectionChange) {
                onSelectionChange([...selectedIds, ...uploadedIds]);
              }
            }}
          />
        </div>
      )}
    </>
  );
};

export default DocumentList;