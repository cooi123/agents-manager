import { useState } from 'react';
import { useDocumentStore } from '../store/documentStore';
import { useUserStore } from '../store/userStore';

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
  const { currentUser } = useUserStore();
  const { getDocumentUrls } = useDocumentStore();
  const SERVICE_URL = import.meta.env.VITE_SERVICE_BROKER_URL;

  const runService = async (documentIds: string[], customInput: string) => {
    if (!currentUser) {
      setState(prev => ({ ...prev, error: 'No authenticated user' }));
      return;
    }

    setState(prev => ({ ...prev, isRunning: true, error: null }));

    try {
      const documentUrls = await getDocumentUrls(documentIds);

      const payload = {
        serviceId,
        userId: currentUser.id,
        documentIds,
        customInput,
        documentUrls,
        projectId
      };

      console.log(SERVICE_URL)
      const response = await fetch(SERVICE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Service request failed');
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
    reset
  };
}; 