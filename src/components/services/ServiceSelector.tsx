import React, { useEffect, useState } from 'react';
import { Checkbox, Modal } from '@carbon/react';
import { useServiceStore } from '../../store/serviceStore';
import { useProjectStore } from '../../store/projectStore';

interface ServiceSelectorProps {
  projectId: string;
  open: boolean;
  onClose: () => void;
}

const ServiceSelector: React.FC<ServiceSelectorProps> = ({ projectId, open, onClose }) => {
  const { services, fetchServices, loading: servicesLoading } = useServiceStore();
  const { currentProject, updateProjectServices, addServiceToProject } = useProjectStore();
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchServices();
    }
  }, [open, fetchServices]);

  useEffect(() => {
    if (currentProject?.services) {
      const selectedIds = currentProject.services.map(service => service.id);
      setSelectedServices(selectedIds);
    }
  }, [currentProject]);

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    await updateProjectServices(projectId, selectedServices);
    setSaving(false);
    onClose();
  };

  return (
    <Modal
      open={open}
      onRequestClose={onClose}
      modalHeading="Select Services"
      primaryButtonText="Save"
      secondaryButtonText="Cancel"
      onRequestSubmit={handleSave}
      onSecondarySubmit={onClose}
      primaryButtonDisabled={saving}
      size="md"
    >
      {servicesLoading ? (
        <p>Loading services...</p>
      ) : (
        <div className="space-y-4 mt-4">
          {services.length === 0 ? (
            <p>No services available</p>
          ) : (
            services.map(service => (
              <Checkbox
                key={service.id}
                id={`service-${service.id}`}
                labelText={service.name}
                checked={selectedServices.includes(service.id)}
                onChange={() => handleServiceToggle(service.id)}
              />
            ))
          )}
        </div>
      )}
    </Modal>
  );
};

export default ServiceSelector;