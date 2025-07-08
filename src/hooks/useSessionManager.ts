import { useEffect } from 'react';
import { sessionManager } from '@/utils/auth/sessionManager';
import { useAuth } from '@/contexts/AuthContext';

export const useSessionManager = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // User is logged in, ensure session manager is active
      sessionManager.updateActivity();
      
      return () => {
        // Cleanup is handled by the singleton sessionManager
      };
    } else {
      // User is logged out, destroy session manager
      sessionManager.destroy();
    }
  }, [user]);

  return {
    updateActivity: () => sessionManager.updateActivity(),
    getSessionInfo: () => sessionManager.getSessionInfo(),
  };
};