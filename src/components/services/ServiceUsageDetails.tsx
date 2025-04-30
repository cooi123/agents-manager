import React from 'react';
import {
  Modal,
  Tag,
  CodeSnippet,
  Button,
} from '@carbon/react';
import { Download } from '@carbon/icons-react';
import { formatDate } from '../../utils/formatters';
import { useServiceStore } from '../../store/serviceStore';
import ReactMarkdown from 'react-markdown';
import { supabase } from '../../services/supabase';

interface ServiceUsageDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  usage: {
    id: string;
    service_id: string;
    created_at: string;
    status: string;
    custom_input: string | null;
    result: any;
    document_id: string | null;
  } | null;
}

const ServiceUsageDetails: React.FC<ServiceUsageDetailsProps> = ({ isOpen, onClose, usage }) => {
  const { services } = useServiceStore();
  
  const service = usage ? services.find(s => s.id === usage.service_id) : null;

  const handleDownload = async () => {
    if (!usage?.document_id) return;

    try {
      const { data: doc } = await supabase
        .from('personal_documents')
        .select('path, filename')
        .eq('id', usage.document_id)
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

        {usage.custom_input && (
          <div className="py-4">
            <dt className="text-sm font-medium text-gray-500">Input</dt>
            <dd className="mt-1">
              <CodeSnippet type="single">
                {usage.custom_input}
              </CodeSnippet>
            </dd>
          </div>
        )}

        {usage.document_id && (
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

{usage.result && (
  <div className="py-4">
    <dt className="text-sm font-medium text-gray-500">Result</dt>
    <dd className="mt-4">
      <div className="bg-white rounded-lg shadow p-6">
        {usage.result.subject && (
          <h2 className="text-xl font-semibold mb-4">
            {usage.result.subject}
          </h2>
        )}
        <div className="prose max-w-none">
          {usage.result.raw ? (
            // Render markdown if raw content is available
            <ReactMarkdown>
              {usage.result.raw}
            </ReactMarkdown>
          ) : usage.result.body ? (
            // Render body as markdown if available
            <ReactMarkdown>
              {usage.result.body}
            </ReactMarkdown>
          ) : (
            // Otherwise pretty-print the JSON
            <pre className="bg-gray-50 p-4 rounded overflow-auto">
              <code>
                {JSON.stringify(usage.result, null, 2)}
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