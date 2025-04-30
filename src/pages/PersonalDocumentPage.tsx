import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Grid, Column, Tile, Loading, Button, Tag, Dropdown, Modal, TextArea, Stack } from '@carbon/react';
import { ArrowLeft, Download } from '@carbon/icons-react';
import { supabase } from '../services/supabase';
import { useServiceUsageStore } from '../store/serviceUsageStore';
import { usePersonalDocumentStore } from '../store/personalDocumentStore';
import { useServiceStore } from '../store/serviceStore';
import { formatDate, formatFileSize } from '../utils/formatters';
import ServiceUsageList from '../components/services/ServiceUsageList';

const PersonalDocumentPage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const { documents, loading, fetchDocuments } = usePersonalDocumentStore();
  const { services, fetchServices } = useServiceStore();
  const { createUsageRecord } = useServiceUsageStore();
  const [document, setDocument] = useState<any>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchDocuments();
    fetchServices();
  }, [fetchDocuments]);

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
      const { data, error } = await supabase.storage
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

  const handleServiceSubmit = async () => {
    if (!document || !selectedService || !url) return;
    
    try {
      setProcessing(true);
      setError(null);
      
      const service = services.find(s => s.id === selectedService);
      if (!service) throw new Error('Service not found');

      // Make request to service
      const response = await fetch(service.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: customInput,
          documentUrl: url,
        }),
      });

      if (!response.ok) {
        throw new Error('Service request failed');
      }

      const result = await response.json();

      // Create usage record
      const usageRecord = await createUsageRecord(
        service.id,
        document.id,
        customInput,
        result
      );

      if (usageRecord) {
        setError(null);
        setIsModalOpen(false);
        setCustomInput('');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
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
            onClick={() => navigate('/my-documents')}
          >
            Back to Documents
          </Button>
          <Button
            renderIcon={Download}
            onClick={handleDownload}
          >
            Download
          </Button>
          <Dropdown
            id="service-select"
            titleText="Process with Service"
            label="Select a service"
            items={services}
            itemToString={(item) => (item ? item.name : '')}
            onChange={({ selectedItem }) => {
              if (selectedItem) {
                setSelectedService(selectedItem.id);
                setIsModalOpen(true);
              }
            }}
          />
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
      
      <Column lg={16} md={8} sm={4}>
        <Tile className="p-5 mt-5">
          <h2 className="text-xl font-semibold mb-4">Service Transactions</h2>
          <ServiceUsageList documentId={documentId} />
        </Tile>
      </Column>
      <Modal
        open={isModalOpen}
        onRequestClose={() => {
          setIsModalOpen(false);
          setCustomInput('');
          setError(null);
        }}
        modalHeading="Process Document"
        primaryButtonText={processing ? "Processing..." : "Submit"}
        secondaryButtonText="Cancel"
        primaryButtonDisabled={processing}
        onRequestSubmit={handleServiceSubmit}
      >
        <Stack gap={7}>
          {error && (
            <div className="text-red-500 mb-4">
              {error}
            </div>
          )}
          
          {services.find(s => s.id === selectedService)?.instructions && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Instructions</h3>
              <p className="text-gray-600">
                {services.find(s => s.id === selectedService)?.instructions}
              </p>
            </div>
          )}
          
          <TextArea
            id="customInput"
            labelText="Additional Information"
            placeholder="Enter any additional information needed for the service..."
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            rows={4}
          />
        </Stack>
      </Modal>
    </Grid>
  );
};

export default PersonalDocumentPage;