import { useState, useEffect } from 'react';
import { useDocumentStore } from '../store/documentStore';
import { useUserStore } from '../store/userStore';
import { useServiceStore } from '../store/serviceStore';

// Add Supabase Edge Function URL
const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/task-trigger`;

interface ServiceRunState {
  isRunning: boolean;
  error: string | null;
  result: any | null;
}

export const useServiceRun = (serviceId: string, projectId: string) => {
  const [state, setState] = useState<ServiceRunState>({
    isRunning: false,
    error: null,
    result: null
  });
  const [service, setService] = useState<any>(null);
  const [isLoadingService, setIsLoadingService] = useState(true);
  
  const { fetchService } = useServiceStore();
  const { currentUser } = useUserStore();
  const { getDocumentUrls } = useDocumentStore();
  // trigger edge supabase edge fucntion

  useEffect(() => {
    const loadService = async () => {
      try {
        setIsLoadingService(true);
        const serviceData = await fetchService(serviceId);
        setService(serviceData);
      } catch (error) {
        setState(prev => ({ ...prev, error: 'Failed to load service' }));
      } finally {
        setIsLoadingService(false);
      }
    };

    loadService();
  }, [serviceId, fetchService]);

  const runService = async (documentIds: string[], customInput: string) => {
    if (!currentUser) {
      setState(prev => ({ ...prev, error: 'No authenticated user' }));
      return;
    }

    if (!service) {
      setState(prev => ({ ...prev, error: 'Service not loaded' }));
      return;
    }

    setState(prev => ({ ...prev, isRunning: true, error: null }));

    try {
      const documentUrls = await getDocumentUrls(documentIds);

      const payload = {
        serviceId,
        userId: currentUser.id,
        documentIds,
        inputData: {text: customInput},
        documentUrls,
        projectId,
        serviceUrl: service.url
      };

      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Service request failed');
      }

      const result = await response.json();
      setState(prev => ({ ...prev, result, isRunning: false }));
      return result;
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message, isRunning: false }));
      throw err;
    }
  };

  const reset = () => {
    setState({ isRunning: false, error: null, result: null });
  };

  return {
    ...state,
    runService,
    reset,
    isLoadingService,
    service
  };
}; 