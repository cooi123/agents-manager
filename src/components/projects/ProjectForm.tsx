import React, { useState } from 'react';
import {
  Form,
  TextInput,
  TextArea,
  Button,
  InlineNotification,
  Stack,
  Modal,
} from '@carbon/react';
import { useProjectStore } from '../../store/projectStore';
import { useAuthStore } from '../../store/authStore';

type ProjectFormProps = {
  isOpen: boolean;
  onClose: () => void;
};

const ProjectForm: React.FC<ProjectFormProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const { createProject } = useProjectStore();

  const handleSubmit = async () => {
    if (!user) return;
    
    setError(null);
    
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }
    
    try {
      const newProject = await createProject(name, description, user.id);
      
      if (newProject) {
        setName('');
        setDescription('');
        onClose();
      } else {
        setError('Failed to create project');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  return (
    <Modal
      open={isOpen}
      modalHeading="Create New Project"
      primaryButtonText="Create"
      secondaryButtonText="Cancel"
      onRequestSubmit={handleSubmit}
      onRequestClose={onClose}
    >
      <Form>
        <Stack gap={7}>
          {error && (
            <InlineNotification
              kind="error"
              title="Error"
              subtitle={error}
              hideCloseButton
            />
          )}
          
          <TextInput
            id="projectName"
            labelText="Project Name"
            placeholder="Enter project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          
          <TextArea
            id="projectDescription"
            labelText="Description (Optional)"
            placeholder="Enter project description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </Stack>
      </Form>
    </Modal>
  );
};

export default ProjectForm;