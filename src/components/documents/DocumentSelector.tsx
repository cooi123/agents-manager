import React, { useEffect, useState } from 'react';
import { Checkbox, SkeletonText } from '@carbon/react';
import { useDocumentStore } from '../../store/documentStore';
import type { Database } from '../../types/database.types';

type Document = Database['public']['Tables']['documents']['Row'];

interface DocumentSelectorProps {
  projectId?: string;
  onSelectionChange: (selectedDocIds: string[]) => void;
}

const DocumentSelector: React.FC<DocumentSelectorProps> = ({ projectId, onSelectionChange }) => {
  const { projectDocuments, loading, fetchDocuments } = useDocumentStore();
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (projectId) {
        await fetchDocuments(projectId);
      }
    };
    
    loadData();
  }, [projectId, fetchDocuments]);

  const handleCheckboxChange = (docId: string, isChecked: boolean) => {
    let newSelection;
    
    if (isChecked) {
      newSelection = [...selectedDocuments, docId];
    } else {
      newSelection = selectedDocuments.filter(id => id !== docId);
    }
    
    setSelectedDocuments(newSelection);
    onSelectionChange(newSelection);
  };

  const renderDocumentSection = (docs: Document[], title: string, isLoading: boolean) => {
    if (isLoading) {
      return (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">{title}</h4>
          <SkeletonText paragraph width="100%" lineCount={3} />
        </div>
      );
    }

    if (!docs || docs.length === 0) {
      return (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">{title}</h4>
          <p className="text-gray-500 text-sm">No documents available</p>
        </div>
      );
    }

    return (
      <div className="mt-4">
        <h4 className="text-sm font-medium mb-2">{title}</h4>
        <div className="max-h-48 overflow-y-auto border border-gray-200 rounded p-2">
          {docs.map((doc) => (
            <Checkbox
              key={doc.id}
              id={`doc-${doc.id}`}
              labelText={doc.filename}
              checked={selectedDocuments.includes(doc.id)}
              onChange={(_, { checked }) => handleCheckboxChange(doc.id, checked)}
              className="mb-2"
            />
          ))}
        </div>
      </div>
    );
  };

  if (!projectId) {
    return (
      <div className="mt-4">
        <p className="text-gray-500">No project specified</p>
      </div>
    );
  }

  return renderDocumentSection(projectDocuments, "Project Documents", loading);
};

export default DocumentSelector;