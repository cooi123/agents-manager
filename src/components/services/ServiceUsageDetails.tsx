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

        {usage.result_payload && (
          <div className="py-4">
            <dt className="text-sm font-medium text-gray-500">Result</dt>
            <dd className="mt-4">
              <div className="bg-white rounded-lg shadow p-6">
                {typeof usage.result_payload === 'object' && usage.result_payload !== null && 'subject' in usage.result_payload && (
                  <h2 className="text-xl font-semibold mb-4">
                    {String(usage.result_payload.subject)}
                  </h2>
                )}
                <div className="prose max-w-none">
                  {typeof usage.result_payload === 'object' && usage.result_payload !== null && 'raw' in usage.result_payload ? (
                    // Render markdown if raw content is available
                    <ReactMarkdown>
                      {String(usage.result_payload.raw)}
                    </ReactMarkdown>
                  ) : typeof usage.result_payload === 'object' && usage.result_payload !== null && 'body' in usage.result_payload ? (
                    // Render body as markdown if available
                    <ReactMarkdown>
                      {String(usage.result_payload.body)}
                    </ReactMarkdown>
                  ) : (
                    // Otherwise pretty-print the JSON
                    <pre className="bg-gray-50 p-4 rounded overflow-auto">
                      <code>
                        {JSON.stringify(usage.result_payload, null, 2)}
                      </code>
                    </pre>
                  )}
                </div>
              </div>
            </dd>
          </div>
        )}
      </dl>
    </Modal>
  );
};

export default ServiceUsageDetails;