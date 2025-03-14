import { useState, useEffect } from 'react';

// Types for analytics and cache
export interface BypassAnalytics {
  totalAttempts: number;
  serviceStats: Record<string, {
    attempts: number;
    successes: number;
    failures: number;
  }>;
  domainStats: Record<string, {
    attempts: number;
    bestService: string;
    successRate: number;
  }>;
}

export interface BypassCache {
  [url: string]: {
    service: string;
    timestamp: number;
    successful: boolean;
  };
}

// Initial state for analytics
const initialAnalytics: BypassAnalytics = {
  totalAttempts: 0,
  serviceStats: {
    'scribe': { attempts: 0, successes: 0, failures: 0 },
    '12ft': { attempts: 0, successes: 0, failures: 0 },
    'archive.is': { attempts: 0, successes: 0, failures: 0 },
    'archive.ph': { attempts: 0, successes: 0, failures: 0 }
  },
  domainStats: {}
};

// Local storage keys
const ANALYTICS_STORAGE_KEY = 'bypass_analytics';
const CACHE_STORAGE_KEY = 'bypass_cache';
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Custom hook for bypass analytics
 */
export function useBypassAnalytics() {
  const [analytics, setAnalytics] = useState<BypassAnalytics>(initialAnalytics);
  
  // Load analytics from local storage on mount
  useEffect(() => {
    try {
      const storedAnalytics = localStorage.getItem(ANALYTICS_STORAGE_KEY);
      if (storedAnalytics) {
        const parsedAnalytics = JSON.parse(storedAnalytics);
        
        // Fix any existing success rates that are over 100%
        if (parsedAnalytics.domainStats) {
          Object.keys(parsedAnalytics.domainStats).forEach(domain => {
            if (parsedAnalytics.domainStats[domain].successRate > 100) {
              parsedAnalytics.domainStats[domain].successRate = 100;
            }
          });
        }
        
        setAnalytics(parsedAnalytics);
      }
    } catch (error) {
      console.error('Failed to load analytics from local storage:', error);
    }
  }, []);
  
  // Save analytics to local storage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(analytics));
    } catch (error) {
      console.error('Failed to save analytics to local storage:', error);
    }
  }, [analytics]);
  
  /**
   * Record a bypass attempt
   */
  const recordAttempt = (domain: string, service: string) => {
    setAnalytics(prev => {
      // Create copies to modify
      const serviceStats = { ...prev.serviceStats };
      const domainStats = { ...prev.domainStats };
      
      // Update service stats
      if (!serviceStats[service]) {
        serviceStats[service] = { attempts: 0, successes: 0, failures: 0 };
      }
      serviceStats[service].attempts += 1;
      
      // Update domain stats
      if (!domainStats[domain]) {
        domainStats[domain] = { attempts: 0, bestService: service, successRate: 0 };
      }
      domainStats[domain].attempts += 1;
      
      return {
        totalAttempts: prev.totalAttempts + 1,
        serviceStats,
        domainStats
      };
    });
  };
  
  /**
   * Record a successful bypass
   */
  const recordSuccess = (domain: string, service: string) => {
    setAnalytics(prev => {
      // Create copies to modify
      const serviceStats = { ...prev.serviceStats };
      const domainStats = { ...prev.domainStats };
      
      // Update service stats
      if (!serviceStats[service]) {
        serviceStats[service] = { attempts: 1, successes: 1, failures: 0 };
      } else {
        serviceStats[service].successes += 1;
      }
      
      // Update domain stats
      if (!domainStats[domain]) {
        domainStats[domain] = { attempts: 1, bestService: service, successRate: 100 };
      } else {
        // Calculate new success rate based on total successes and attempts
        const totalSuccesses = Math.min(
          (domainStats[domain].successRate / 100) * domainStats[domain].attempts + 1,
          domainStats[domain].attempts
        );
        const newSuccessRate = (totalSuccesses / domainStats[domain].attempts) * 100;
        
        // Cap success rate at 100%
        domainStats[domain].successRate = Math.min(
          Math.round(newSuccessRate * 10) / 10,
          100
        );
        
        // Update best service if this one has better success rate
        const serviceSuccessRate = Math.min(
          (serviceStats[service].successes / serviceStats[service].attempts) * 100,
          100
        );
        const currentBestRate = serviceStats[domainStats[domain].bestService]?.successes / 
                               serviceStats[domainStats[domain].bestService]?.attempts * 100 || 0;
                               
        if (serviceSuccessRate > currentBestRate) {
          domainStats[domain].bestService = service;
        }
      }
      
      return {
        ...prev,
        serviceStats,
        domainStats
      };
    });
  };
  
  /**
   * Record a failed bypass
   */
  const recordFailure = (domain: string, service: string) => {
    setAnalytics(prev => {
      // Create copies to modify
      const serviceStats = { ...prev.serviceStats };
      const domainStats = { ...prev.domainStats };
      
      // Update service stats
      if (!serviceStats[service]) {
        serviceStats[service] = { attempts: 1, successes: 0, failures: 1 };
      } else {
        serviceStats[service].failures += 1;
      }
      
      // Update domain stats
      if (!domainStats[domain]) {
        domainStats[domain] = { attempts: 1, bestService: service, successRate: 0 };
      } else {
        // Recalculate success rate and ensure it doesn't exceed 100%
        const successCount = Math.min(
          (domainStats[domain].successRate / 100) * domainStats[domain].attempts,
          domainStats[domain].attempts - 1
        );
        const newSuccessRate = (successCount / domainStats[domain].attempts) * 100;
        domainStats[domain].successRate = Math.min(
          Math.round(newSuccessRate * 10) / 10,
          100
        );
      }
      
      return {
        ...prev,
        serviceStats,
        domainStats
      };
    });
  };
  
  /**
   * Get the recommended service for a domain based on analytics
   */
  const getRecommendedService = (domain: string, defaultService: string): string => {
    if (analytics.domainStats[domain] && analytics.domainStats[domain].attempts >= 3) {
      return analytics.domainStats[domain].bestService;
    }
    return defaultService;
  };
  
  return {
    analytics,
    recordAttempt,
    recordSuccess,
    recordFailure,
    getRecommendedService
  };
}

/**
 * Custom hook for bypass cache
 */
export function useBypassCache() {
  const [cache, setCache] = useState<BypassCache>({});
  
  // Load cache from local storage on mount
  useEffect(() => {
    try {
      const storedCache = localStorage.getItem(CACHE_STORAGE_KEY);
      if (storedCache) {
        const parsedCache = JSON.parse(storedCache);
        
        // Filter out expired entries
        const now = Date.now();
        const validCache = Object.entries(parsedCache).reduce((acc, [key, value]) => {
          const entry = value as { service: string; timestamp: number; successful: boolean };
          if (now - entry.timestamp < CACHE_EXPIRY) {
            acc[key] = entry;
          }
          return acc;
        }, {} as BypassCache);
        
        setCache(validCache);
      }
    } catch (error) {
      console.error('Failed to load cache from local storage:', error);
    }
  }, []);
  
  // Save cache to local storage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Failed to save cache to local storage:', error);
    }
  }, [cache]);
  
  /**
   * Get cached service for a URL
   */
  const getCachedService = (url: string): { service: string; successful: boolean } | null => {
    const cacheEntry = cache[url];
    if (cacheEntry && Date.now() - cacheEntry.timestamp < CACHE_EXPIRY) {
      return {
        service: cacheEntry.service,
        successful: cacheEntry.successful
      };
    }
    return null;
  };
  
  /**
   * Add a URL to the cache
   */
  const cacheUrl = (url: string, service: string, successful: boolean) => {
    setCache(prev => ({
      ...prev,
      [url]: {
        service,
        timestamp: Date.now(),
        successful
      }
    }));
  };
  
  /**
   * Clear the cache
   */
  const clearCache = () => {
    setCache({});
    localStorage.removeItem(CACHE_STORAGE_KEY);
  };
  
  return {
    cache,
    getCachedService,
    cacheUrl,
    clearCache
  };
}