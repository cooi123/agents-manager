import React, { useState, useEffect } from 'react';
import { Modal, Loading } from '@carbon/react';
import { supabase } from '../../services/supabase';

interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    filename: string;
    mimetype: string;
    path: string;
  } | null;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ isOpen, onClose, document }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getDocumentUrl() {
      if (!document) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase.storage
          .from('documents')
          .createSignedUrl(document.path, 3600); // 1 hour expiry
        
        if (error) throw error;
        setUrl(data.signedUrl);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (isOpen && document) {
      getDocumentUrl();
    } else {
      setUrl(null);
    }
  }, [isOpen, document]);

  const renderContent = () => {
    if (loading) {
      return <Loading description="Loading document..." />;
    }

    if (error) {
      return <p className="text-red-500">{error}</p>;
    }

    if (!url) {
      return <p>No document to display</p>;
    }

    if (document?.mimetype.startsWith('image/')) {
      return (
        <img 
          src={url} 
          alt={document.filename}
          className="max-w-full max-h-[80vh] object-contain"
        />
      );
    }

    if (document?.mimetype === 'application/pdf') {
      return (
        <iframe
          src={url}
          title={document.filename}
          className="w-full h-[80vh] border-0"
        />
      );
    }

    return (
      <div className="p-4 bg-gray-100 rounded">
        <p>This file type cannot be previewed directly.</p>
        <a 
          href={url}
          download={document?.filename}
          className="text-blue-600 hover:underline mt-2 inline-block"
        >
          Download {document?.filename}
        </a>
      </div>
    );
  };

  return (
    <Modal
      open={isOpen}
      onRequestClose={() => {
        setUrl(null);
        setError(null);
        onClose();
      }}
      modalHeading={document?.filename || 'View Document'}
      primaryButtonText="Close"
      hasScrollingContent
      size="lg"
    >
      <div className="mt-4">
        {renderContent()}
      </div>
    </Modal>
  );
};

export default DocumentViewer;