/**
 * Enhanced session management with auto-logout and security features
 */

import { supabase } from '@/integrations/supabase/client';

export interface SessionConfig {
  autoLogoutOnTabClose: boolean;
  sessionTimeoutMinutes: number;
  maxInactivityMinutes: number;
}

export class SessionManager {
  private config: SessionConfig;
  private lastActivity: number = Date.now();
  private sessionCheckInterval: NodeJS.Timeout | null = null;
  private visibilityChangeListener: () => void;
  private beforeUnloadListener: () => void;

  constructor(config: SessionConfig = {
    autoLogoutOnTabClose: true,
    sessionTimeoutMinutes: 480, // 8 hours
    maxInactivityMinutes: 60, // 1 hour
  }) {
    this.config = config;
    
    this.visibilityChangeListener = this.handleVisibilityChange.bind(this);
    this.beforeUnloadListener = this.handleBeforeUnload.bind(this);
    
    this.init();
  }

  private init() {
    // Track user activity
    this.trackUserActivity();
    
    // Set up session monitoring
    this.startSessionMonitoring();
    
    // Set up tab/browser close detection
    if (this.config.autoLogoutOnTabClose) {
      this.setupTabCloseDetection();
    }
  }

  private trackUserActivity() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const updateActivity = () => {
      this.lastActivity = Date.now();
      localStorage.setItem('lastActivity', this.lastActivity.toString());
    };

    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });
  }

  private startSessionMonitoring() {
    this.sessionCheckInterval = setInterval(() => {
      this.checkSessionValidity();
    }, 60000); // Check every minute
  }

  private async checkSessionValidity() {
    const now = Date.now();
    const timeSinceActivity = now - this.lastActivity;
    const maxInactivity = this.config.maxInactivityMinutes * 60 * 1000;

    // Check for inactivity timeout
    if (timeSinceActivity > maxInactivity) {
      console.log('Session expired due to inactivity');
      await this.forceLogout('Session expired due to inactivity');
      return;
    }

    // Check session with Supabase
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      console.log('Session invalid or expired');
      await this.forceLogout('Session expired');
      return;
    }

    // Check if session is close to expiring and refresh if needed
    const tokenExp = session.expires_at ? session.expires_at * 1000 : 0;
    const timeUntilExpiry = tokenExp - now;
    
    // Refresh token if less than 10 minutes remaining
    if (timeUntilExpiry < 10 * 60 * 1000) {
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.log('Failed to refresh session:', refreshError);
        await this.forceLogout('Failed to refresh session');
      }
    }
  }

  private setupTabCloseDetection() {
    // Handle page visibility change (tab switching)
    document.addEventListener('visibilitychange', this.visibilityChangeListener);
    
    // Handle browser/tab close
    window.addEventListener('beforeunload', this.beforeUnloadListener);
    
    // Handle browser back/forward navigation
    window.addEventListener('pagehide', this.beforeUnloadListener);
  }

  private handleVisibilityChange() {
    if (document.hidden) {
      // Tab became hidden, mark timestamp
      sessionStorage.setItem('tabHiddenAt', Date.now().toString());
    } else {
      // Tab became visible, check if too much time passed
      const hiddenAt = sessionStorage.getItem('tabHiddenAt');
      if (hiddenAt) {
        const timeDiff = Date.now() - parseInt(hiddenAt);
        const maxHiddenTime = 30 * 60 * 1000; // 30 minutes
        
        if (timeDiff > maxHiddenTime) {
          this.forceLogout('Session expired while tab was inactive');
        }
        
        sessionStorage.removeItem('tabHiddenAt');
      }
    }
  }

  private handleBeforeUnload() {
    if (this.config.autoLogoutOnTabClose) {
      // Clear local session data
      localStorage.removeItem('lastActivity');
      sessionStorage.clear();
      
      // Note: We can't await async operations in beforeunload
      // Supabase will handle session cleanup on next app load
      supabase.auth.signOut();
    }
  }

  private async forceLogout(reason: string) {
    console.log('Force logout:', reason);
    
    // Clear all local data
    localStorage.removeItem('lastActivity');
    sessionStorage.clear();
    
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Redirect to login page
    window.location.href = '/auth';
  }

  public updateActivity() {
    this.lastActivity = Date.now();
    localStorage.setItem('lastActivity', this.lastActivity.toString());
  }

  public destroy() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }
    
    document.removeEventListener('visibilitychange', this.visibilityChangeListener);
    window.removeEventListener('beforeunload', this.beforeUnloadListener);
    window.removeEventListener('pagehide', this.beforeUnloadListener);
  }

  public getSessionInfo() {
    return {
      lastActivity: this.lastActivity,
      timeSinceActivity: Date.now() - this.lastActivity,
      config: this.config,
    };
  }
}

// Singleton instance
export const sessionManager = new SessionManager();