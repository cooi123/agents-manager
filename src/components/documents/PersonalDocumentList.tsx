import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Button
} from '@carbon/react';
import { Download, TrashCan, View, List } from '@carbon/icons-react';
import { usePersonalDocumentStore } from '../../store/personalDocumentStore';
import { formatDate, formatFileSize } from '../../utils/formatters';
import DocumentViewer from './DocumentViewer';

const PersonalDocumentList: React.FC = () => {
  const { documents, loading, fetchPersonalDocuments, deleteDocument } = usePersonalDocumentStore();
  const [selectedDocument, setSelectedDocument] = React.useState<any>(null);
  const navigate = useNavigate();
  const [isViewerOpen, setIsViewerOpen] = React.useState(false);
  
  useEffect(() => {
    const fetchUserDocuments = async () => {
      try {
        const { data } = await window.supabase.auth.getUser();
        
        if (data?.user) {
          console.log("Fetching documents for user:", data.user.id);
          fetchPersonalDocuments(data.user.id);
        } else {
          console.error("No authenticated user found");
        }
      } catch (error) {
        console.error("Error getting authenticated user:", error);
      }
    };
    
    fetchUserDocuments();
  }, [fetchPersonalDocuments]);
  
  const headers = [
    { key: 'filename', header: 'Filename' },
    { key: 'filesize', header: 'Size' },
    { key: 'created_at', header: 'Uploaded' },
    { key: 'actions', header: 'Actions' }
  ];
  
  const rows = documents.map((doc) => ({
    id: doc.id,
    filename: doc.filename,
    filesize: formatFileSize(doc.filesize),
    created_at: formatDate(doc.created_at),
  }));

  const handleDownload = async (id: string) => {
    const doc = documents.find(d => d.id === id);
    if (!doc) return;

    try {
      const { data, error } = await window.supabase.storage
        .from('documents')
        .download(doc.path);
      
      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.filename;
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
        <p className="mt-4">Upload your first document to get started</p>
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
                            iconDescription="Quick View"
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
                            onClick={() => navigate(`/my-documents/${row.id}`)}
                          >
                            Details
                          </Button>
                          <Button
                            kind="ghost"
                            size="sm"
                            renderIcon={Download}
                            iconDescription="Download"
                            onClick={() => handleDownload(row.id)}
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

export default PersonalDocumentList;