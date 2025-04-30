import React, { useEffect } from 'react';
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
} from '@carbon/react';
import { View, Download, List, TrashCan } from '@carbon/icons-react';
import { useDocumentStore } from '../../store/documentStore';
import { formatDate, formatFileSize } from '../../utils/formatters';
import DocumentViewer from './DocumentViewer';
import { useNavigate } from 'react-router-dom';

type DocumentListProps = {
  projectId: string;
};

const DocumentList: React.FC<DocumentListProps> = ({ projectId }) => {
  const { projectDocuments: documents, loading, fetchDocuments, deleteDocument} = useDocumentStore();
  const [selectedDocument, setSelectedDocument] = React.useState<any>(null);
  const navigate = useNavigate();
  const [isViewerOpen, setIsViewerOpen] = React.useState(false);
  
  useEffect(() => {
    fetchDocuments(projectId);
  }, [fetchDocuments, projectId]);
  
  const headers = [
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
      
      if (error) {
        throw error;
      }
      
      // Create download link
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

  const handleView = (doc: any) => {
    setSelectedDocument(doc);
    setIsViewerOpen(true);
  };
  
  if (loading) {
    return <Loading />;
  }
  
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Tag type="cool-gray">No Documents</Tag>
        <p className="mt-4">Upload documents to this project</p>
      </div>
    );
  }
  
  return (
    <>
      <DataTable rows={rows} headers={headers}>
        {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
          <Table {...getTableProps()}>
            <TableHead>
              <TableRow>
                {headers.map((header) => (
                  <TableHeader key={header.key} {...getHeaderProps({ header })}>
                    {header.header}
                  </TableHeader>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} {...getRowProps({ row })}>
                  {row.cells.map((cell) => (
                    <TableCell key={cell.id}>
                      {cell.info.header === 'actions' ? (
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
      <DocumentViewer
        isOpen={isViewerOpen}
        onClose={() => {
          setIsViewerOpen(false);
          setSelectedDocument(null);
        }}
        document={selectedDocument}
      />
    </>
  );
};

export default DocumentList;