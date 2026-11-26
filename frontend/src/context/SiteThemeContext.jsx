import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import themeService from '../services/themeService';
import { getSocket } from '../sockets/socketManager';

const SiteThemeContext = createContext(null);

const isWithinSchedule = (theme, now = new Date()) => {
  if (!theme || !theme.isEnabled || !theme.isVisible) return false;
  if (theme.scheduleMode !== 'period') return true;

  const start = theme.startDate ? new Date(theme.startDate) : null;
  const end = theme.endDate ? new Date(theme.endDate) : null;
  if (start && !Number.isNaN(start.getTime()) && now < start) return false;
  if (end && !Number.isNaN(end.getTime()) && now > end) return false;
  return true;
};

export const SiteThemeProvider = ({ children }) => {
  const [activeTheme, setActiveTheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sleighReplayKey, setSleighReplayKey] = useState(0);

  const refreshActiveTheme = useCallback(async () => {
    try {
      const res = await themeService.getActiveTheme();
      const theme = res.data?.data || null;
      setActiveTheme(isWithinSchedule(theme) ? theme : null);
    } catch {
      // Keep storefront resilient if theme fetch fails
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshActiveTheme();
  }, [refreshActiveTheme]);

  // Listen to real-time theme updates from Admin Panel
  useEffect(() => {
    let attachedSocket = null;
    const handleThemeUpdated = (payload) => {
      const nextTheme = payload?.activeTheme || null;
      setActiveTheme(isWithinSchedule(nextTheme) ? nextTheme : null);
    };

    const tryAttach = () => {
      const socket = getSocket();
      if (socket && socket !== attachedSocket) {
        if (attachedSocket) attachedSocket.off('theme_updated', handleThemeUpdated);
        attachedSocket = socket;
        socket.on('theme_updated', handleThemeUpdated);
        return true;
      }
      return Boolean(socket);
    };

    if (!tryAttach()) {
      const retry = window.setInterval(() => {
        if (tryAttach()) window.clearInterval(retry);
      }, 1500);
      return () => {
        window.clearInterval(retry);
        if (attachedSocket) attachedSocket.off('theme_updated', handleThemeUpdated);
      };
    }

    return () => {
      if (attachedSocket) attachedSocket.off('theme_updated', handleThemeUpdated);
    };
  }, []);

  // Re-evaluate period boundaries periodically (and re-sync with server every 5 mins)
  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveTheme((prev) => {
        if (prev && !isWithinSchedule(prev)) return null;
        return prev;
      });
      refreshActiveTheme();
    }, 60 * 1000);
    return () => window.clearInterval(interval);
  }, [refreshActiveTheme]);

  const triggerSleighReplay = useCallback(() => {
    setSleighReplayKey((k) => k + 1);
  }, []);

  const isChristmasActive = Boolean(activeTheme && activeTheme.preset === 'christmas' && isWithinSchedule(activeTheme));

  return (
    <SiteThemeContext.Provider
      value={{
        activeTheme,
        isChristmasActive,
        loading,
        sleighReplayKey,
        triggerSleighReplay,
        refreshActiveTheme,
      }}
    >
      {children}
    </SiteThemeContext.Provider>
  );
};

export const useSiteTheme = () => {
  const ctx = useContext(SiteThemeContext);
  if (!ctx) {
    throw new Error('useSiteTheme must be used within SiteThemeProvider');
  }
  return ctx;
};
