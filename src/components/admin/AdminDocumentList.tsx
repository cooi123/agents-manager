import React, { useEffect } from 'react';
import {
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Link,
  Loading,
  Tag,
} from '@carbon/react';
import { useDocumentStore } from '../../store/documentStore';
import { formatDate, formatFileSize } from '../../utils/formatters';

const AdminDocumentList: React.FC = () => {
  const { projectDocuments: documents, loading, fetchAllDocuments } = useDocumentStore();
  
  useEffect(() => {
    fetchAllDocuments();
  }, [fetchAllDocuments]);
  
  const headers = [
    { key: 'filename', header: 'Filename' },
    { key: 'project_id', header: 'Project ID' },
    { key: 'user_id', header: 'User ID' },
    { key: 'filesize', header: 'Size' },
    { key: 'created_at', header: 'Uploaded' },
    { key: 'actions', header: 'Actions' },
  ];
  
  const rows = documents.map((doc) => ({
    id: doc.id,
    filename: doc.filename,
    project_id: doc.project_id,
    user_id: doc.user_id,
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
  
  if (loading) {
    return <Loading />;
  }
  
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Tag type="cool-gray">No Documents</Tag>
        <p className="mt-4">No documents have been uploaded yet</p>
      </div>
    );
  }
  
  return (
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
                      <Link 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          const doc = documents.find(d => d.id === row.id);
                          if (doc) {
                            handleDownload(doc.path, doc.filename);
                          }
                        }}
                      >
                        Download
                      </Link>
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
  );
};

export default AdminDocumentList;