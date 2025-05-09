import React, { useEffect, useState } from 'react';
import { Checkbox, Modal } from '@carbon/react';
import { useServiceStore } from '../../store/serviceStore';
import { useProjectStore } from '../../store/projectStore';
import type { Database } from '../../types/database.types';

type Service = Database['public']['Tables']['services']['Row'];

interface ServiceSelectorProps {
  projectId: string;
  open: boolean;
  onClose: () => void;
}

const ServiceSelector: React.FC<ServiceSelectorProps> = ({ projectId, open, onClose }) => {
  const { services, fetchServices, loading: servicesLoading } = useServiceStore();
  const {fetchProjectServices, updateProjectServices } = useProjectStore();
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [availableServices, setAvailableServices] = useState<Service[]>(services);
  useEffect(() => {
    if (open) {
      fetchServices();
    }
  }, [open, fetchServices]);

  useEffect(() => {
    const fetchAvailableServices = async () => {
      const projectServices = await fetchProjectServices(projectId);
      const availableServices = services.filter(service => !projectServices.some(s => s.id === service.id));
      setAvailableServices(availableServices);
    };
    fetchAvailableServices();
    
    
  }, [services]);


  const handleServiceToggle = (serviceId: string) => {
    setSelectedServiceIds(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    await updateProjectServices(projectId, selectedServiceIds);
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
          {availableServices.length === 0 ? (
            <p>No New services available</p>
          ) : (
            availableServices.map(service => (
              <Checkbox
                key={service.id}
                id={`service-${service.id}`}
                labelText={service.name}
                checked={selectedServiceIds.includes(service.id)}
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