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
import { Download, TrashCan } from '@carbon/icons-react';
import { usePersonalDocumentStore } from '../../store/personalDocumentStore';
import { formatDate, formatFileSize } from '../../utils/formatters';

const PersonalDocumentList: React.FC = () => {
  const { documents, loading, fetchDocuments, deleteDocument } = usePersonalDocumentStore();
  
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);
  
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
  );
};

export default PersonalDocumentList