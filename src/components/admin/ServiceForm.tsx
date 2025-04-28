import React, { useState, useEffect } from 'react';
import {
  Modal,
  TextInput,
  TextArea,
  Form,
  Stack,
  InlineNotification,
} from '@carbon/react';
import { useServiceStore } from '../../store/serviceStore';

interface ServiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  service?: any;
}

const ServiceForm: React.FC<ServiceFormProps> = ({ isOpen, onClose, service }) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const { createService, updateService } = useServiceStore();
  
  useEffect(() => {
    if (service) {
      setName(service.name);
      setUrl(service.url);
      setDescription(service.description || '');
      setInstructions(service.instructions || '');
    } else {
      setName('');
      setUrl('');
      setDescription('');
      setInstructions('');
    }
  }, [service]);
  
  const handleSubmit = async () => {
    try {
      setError(null);
      
      if (!name.trim() || !url.trim()) {
        setError('Name and URL are required');
        return;
      }
      
      const serviceData = {
        name: name.trim(),
        url: url.trim(),
        description: description.trim() || null,
        instructions: instructions.trim() || null,
      };
      
      if (service) {
        await updateService(service.id, serviceData);
      } else {
        await createService(serviceData);
      }
      
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  };
  
  return (
    <Modal
      open={isOpen}
      onRequestClose={onClose}
      modalHeading={service ? 'Edit Service' : 'Add New Service'}
      primaryButtonText={service ? 'Save Changes' : 'Create Service'}
      secondaryButtonText="Cancel"
      onRequestSubmit={handleSubmit}
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
            id="name"
            labelText="Service Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          
          <TextInput
            id="url"
            labelText="Service URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          
          <TextArea
            id="description"
            labelText="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
          
          <TextArea
            id="instructions"
            labelText="Instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={4}
          />
        </Stack>
      </Form>
    </Modal>
  );
};

export default ServiceForm;