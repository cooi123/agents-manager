import React, { useEffect, useState } from 'react';
import { Checkbox, SkeletonText, Tabs, Tab } from '@carbon/react';
import { usePersonalDocumentStore } from '../../store/personalDocumentStore';
import { useDocumentStore } from '../../store/documentStore';

interface DocumentSelectorProps {
  userId?: string;
  projectId?: string;
  onSelectionChange: (selectedDocIds: string[]) => void;
}

const DocumentSelector: React.FC<DocumentSelectorProps> = ({ userId, projectId, onSelectionChange }) => {
  const { documents: personalDocuments, loading: personalLoading, fetchPersonalDocuments } = usePersonalDocumentStore();
  const { projectDocuments, loading: projectLoading, fetchDocuments } = useDocumentStore();
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);

  // Fetch documents based on provided IDs
  useEffect(() => {
    const loadData = async () => {
      if (userId) {
        const docs = await fetchPersonalDocuments(userId);
      }
      
      if (projectId) {
        await fetchDocuments(projectId);
      }
    };
    
    loadData();
  }, [userId, projectId, fetchPersonalDocuments, fetchDocuments]);
  

  
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

  // Create a documents section based on type (personal or project)
  const renderDocumentSection = (docs: any[], title: string, loading: boolean) => {
    if (loading) {
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
              labelText={doc.filename || doc.name}
              checked={selectedDocuments.includes(doc.id)}
              onChange={(_, { checked }) => handleCheckboxChange(doc.id, checked)}
              className="mb-2"
            />
          ))}
        </div>
      </div>
    );
  };

  // Otherwise, show just one section
  if (userId) {
    return renderDocumentSection(personalDocuments, "Your Documents", personalLoading);
  }
  
  if (projectId) {
    return renderDocumentSection(projectDocuments, "Project Documents", projectLoading);
  }

  // Fallback if neither is provided
  return (
    <div className="mt-4">
      <p className="text-gray-500">No document source specified</p>
    </div>
  );
};

export default DocumentSelector;