import React, { useState } from 'react';
import {
  Modal,
  Tag,
  CodeSnippet,
  Button,
  TextInput,
} from '@carbon/react';
import { Download, Edit } from '@carbon/icons-react';
import { formatDate } from '../../utils/formatters';
import { useServiceStore } from '../../store/serviceStore';
import ReactMarkdown from 'react-markdown';
import { supabase } from '../../services/supabase';
import type { Database } from '../../types/database.types';

type Transaction = Database['public']['Tables']['transactions']['Row'] & {
  subtasks?: Transaction[];
};

interface ServiceUsageDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  usage: Transaction | null;
}

const ServiceUsageDetails: React.FC<ServiceUsageDetailsProps> = ({ isOpen, onClose, usage }) => {
  const { services } = useServiceStore();
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(usage?.description || '');
  
  const service = usage ? services.find(s => s.id === usage.service_id) : null;
console.log("Resutlt", usage?.result_payload)
  const handleSaveDescription = async () => {
    if (!usage) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .update({ description })
        .eq('id', usage.id);

      if (error) throw error;
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating description:', error);
    }
  };

  const handleDownload = async () => {
    if (!usage?.input_document_urls?.length) return;

    try {
      const { data: doc } = await supabase
        .from('documents')
        .select('path, filename')
        .eq('id', usage.input_document_urls[0])
        .single();

      if (!doc) return;

      const { data, error } = await supabase.storage
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
      console.error('Error downloading document:', error);
    }
  };

  if (!usage) return null;

  return (
    <Modal
      open={isOpen}
      onRequestClose={onClose}
      modalHeading="Transaction Details"
      primaryButtonText="Close"
      size="lg"
    >
      <dl className="divide-y divide-gray-200">
        <div className="py-4">
          <dt className="text-sm font-medium text-gray-500">Service</dt>
          <dd className="mt-1 text-sm text-gray-900">{service?.name || 'Unknown Service'}</dd>
        </div>

        <div className="py-4">
          <dt className="text-sm font-medium text-gray-500">Date</dt>
          <dd className="mt-1 text-sm text-gray-900">{formatDate(usage.created_at)}</dd>
        </div>

        <div className="py-4">
          <dt className="text-sm font-medium text-gray-500">Status</dt>
          <dd className="mt-1">
            <Tag type={usage.status === 'pending' ? 'blue' : 'green'}>
              {usage.status}
            </Tag>
          </dd>
        </div>

        <div className="py-4">
          <dt className="text-sm font-medium text-gray-500 flex items-center justify-between">
            <span>Description</span>
            {!isEditing && (
              <Button
                kind="ghost"
                size="sm"
                renderIcon={Edit}
                iconDescription="Edit description"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            )}
          </dt>
          <dd className="mt-1">
            {isEditing ? (
              <div className="flex gap-2">
                <TextInput
                  id="description"
                  labelText="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="flex-grow"
                />
                <Button
                  kind="primary"
                  size="sm"
                  onClick={handleSaveDescription}
                >
                  Save
                </Button>
                <Button
                  kind="secondary"
                  size="sm"
                  onClick={() => {
                    setDescription(usage.description || '');
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <p className="text-sm text-gray-900">{usage.description || 'No description'}</p>
            )}
          </dd>
        </div>

        {usage.input_data && (
          <div className="py-4">
            <dt className="text-sm font-medium text-gray-500">Input</dt>
            <dd className="mt-1">
              <CodeSnippet type="single">
                {JSON.stringify(usage.input_data)}
              </CodeSnippet>
            </dd>
          </div>
        )}

        {usage.input_document_urls?.length > 0 && (
          <div className="py-4">
            <dt className="text-sm font-medium text-gray-500">Document</dt>
            <dd className="mt-1">
              <Button
                kind="ghost"
                size="sm"
                renderIcon={Download}
                onClick={handleDownload}
              >
                Download Document
              </Button>
            </dd>
          </div>
        )}

        {usage.result_document_urls && usage.result_document_urls.length > 0 && (
          <div className="py-4">
            <dt className="text-sm font-medium text-gray-500">Result Documents</dt>
            <dd className="mt-1">
              <div className="space-y-4">
                {usage.result_document_urls.map((url, index) => {
                  const fileExtension = url.split('.').pop()?.toLowerCase();
                  const isAudio = fileExtension === 'wav' || fileExtension === 'mp3';
                  const isText = fileExtension === 'txt';

                  return (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Button
                          kind="ghost"
                          size="sm"
                          renderIcon={Download}
                          onClick={() => window.open(url, '_blank')}
                        >
                          Result Document {index + 1}
                        </Button>
                        <span className="text-sm text-gray-500">({fileExtension?.toUpperCase()})</span>
                      </div>

                      {/* Preview Section */}
                      <div className="mt-2">
                        {isAudio && (
                          <div className="mt-2">
                            <audio controls className="w-full">
                              <source src={url} type={`audio/${fileExtension}`} />
                              Your browser does not support the audio element.
                            </audio>
                          </div>
                        )}
                        
                        {isText && (
                          <div className="mt-2">
                            <Button
                              kind="ghost"
                              size="sm"
                              onClick={async () => {
                                try {
                                  const response = await fetch(url);
                                  const text = await response.text();
                                  // Create a modal or use existing modal to show text
                                  const textWindow = window.open('', '_blank');
                                  if (textWindow) {
                                    textWindow.document.write(`
                                      <html>
                                        <head>
                                          <title>Text Preview</title>
                                          <style>
                                            body { 
                                              font-family: monospace;
                                              white-space: pre-wrap;
                                              padding: 20px;
                                              margin: 0;
                                            }
                                          </style>
                                        </head>
                                        <body>${text}</body>
                                      </html>
                                    `);
                                  }
                                } catch (error) {
                                  console.error('Error loading text file:', error);
                                }
                              }}
                            >
                              Preview Text
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </dd>
          </div>
        )}

        {usage.result_payload && (
          <div className="py-4">
            <dt className="text-sm font-medium text-gray-500">Result</dt>
            <dd className="mt-4">
              <div className="bg-white rounded-lg shadow p-6">
                {typeof usage.result_payload === 'object' && usage.result_payload !== null && (
                  <>
                    {/* Handle unstructured text (markdown) */}
                    {'unstructured_text' in usage.result_payload && (
                      <div className="prose max-w-none">
                        <ReactMarkdown>
                          {String(usage.result_payload.unstructured_text)}
                        </ReactMarkdown>
                      </div>
                    )}
                    
                    {/* Handle structured data */}
                    {'structured' in usage.result_payload && (
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Structured Data</h3>
                        <pre className="bg-gray-50 p-4 rounded overflow-auto text-sm">
                          <code>
                            {JSON.stringify(usage.result_payload.structured, null, 2)}
                          </code>
                        </pre>
                      </div>
                    )}

                    {/* Fallback for other object formats */}
                    {!('unstructured_text' in usage.result_payload) && !('structured' in usage.result_payload) && (
                      <pre className="bg-gray-50 p-4 rounded overflow-auto text-sm">
                        <code>
                          {JSON.stringify(usage.result_payload, null, 2)}
                        </code>
                      </pre>
                    )}
                  </>
                )}
              </div>
            </dd>
          </div>
        )}
      </dl>
    </Modal>
  );
};

export default ServiceUsageDetails;