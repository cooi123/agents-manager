import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Grid, Column, Tile, Loading, Button, Tag } from '@carbon/react';
import { ArrowLeft, Download } from '@carbon/icons-react';
import { supabase } from '../services/supabase';
import { useDocumentStore } from '../store/documentStore'; 
import { useProjectStore } from '../store/projectStore'; 
import { formatDate, formatFileSize } from '../utils/formatters';

const DocumentPage: React.FC = () => {
  const { projectId, documentId } = useParams<{ projectId: string; documentId: string }>();
  const navigate = useNavigate();
  const { documents, loading, fetchDocuments } = useDocumentStore();
  const { currentProject, fetchProject } = useProjectStore();
  const [document, setDocument] = useState<any>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      fetchProject(projectId);
      fetchDocuments(projectId);
    }
  }, [projectId, fetchProject, fetchDocuments]);

  useEffect(() => {
    if (documents.length > 0 && documentId) {
      const doc = documents.find(d => d.id === documentId);
      setDocument(doc || null);
    }
  }, [documents, documentId]);

  useEffect(() => {
    async function getDocumentUrl() {
      if (!document) return;
      
      try {
        setLoadingPreview(true);
        setError(null);
        
        const { data, error } = await supabase.storage
          .from('documents')
          .createSignedUrl(document.path, 3600); // 1 hour expiry
        
        if (error) throw error;
        setUrl(data.signedUrl);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoadingPreview(false);
      }
    }

    if (document) {
      getDocumentUrl();
    }
  }, [document]);

  const handleDownload = async () => {
    if (!document) return;
    
    try {
      const { data, error } = await window.supabase.storage
        .from('documents')
        .download(document.path);
      
      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = document.filename;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loading withOverlay={false} description="Loading document..." />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="h-full flex items-center justify-center">
        <Tag type="red">Document not found</Tag>
      </div>
    );
  }

  return (
    <Grid fullWidth className="p-5">
      <Column lg={16} md={8} sm={4}>
        <div className="flex items-center gap-4 mb-6">
          <Button
            kind="ghost"
            renderIcon={ArrowLeft}
            onClick={() => navigate(`/projects/${projectId}`)}
          >
            Back to Project
          </Button>
          <Button
            renderIcon={Download}
            onClick={handleDownload}
          >
            Download
          </Button>
        </div>

        <Tile className="p-5 mb-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">{document.filename}</h1>
              <p className="text-gray-600">
                Uploaded {formatDate(document.created_at)} • {formatFileSize(document.filesize)}
              </p>
            </div>
          </div>
        </Tile>

        <Tile className="p-5 overflow-auto">
          {loadingPreview ? (
            <div className="flex justify-center p-8">
              <Loading description="Loading preview..." />
            </div>
          ) : error ? (
            <div className="p-4 text-red-500">
              {error}
            </div>
          ) : url ? (
            document.mimetype.startsWith('image/') ? (
              <img 
                src={url} 
                alt={document.filename}
                className="max-w-full max-h-[80vh] object-contain mx-auto"
              />
            ) : document.mimetype === 'application/pdf' ? (
              <iframe
                src={url}
                title={document.filename}
                className="w-full h-[80vh] border-0"
              />
            ) : (
              <div className="p-4 bg-gray-100 rounded text-center">
                <p className="mb-4">This file type cannot be previewed directly.</p>
                <Button 
                  onClick={handleDownload}
                  renderIcon={Download}
                >
                  Download {document.filename}
                </Button>
              </div>
            )
          ) : (
            <div className="p-4 text-center">
              No preview available
            </div>
          )}
        </Tile>
      </Column>
    </Grid>
  );
};

export default DocumentPage;