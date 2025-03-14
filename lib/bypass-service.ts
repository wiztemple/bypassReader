// ==== lib/bypass-service.ts ====
export interface BypassResult {
    serviceUrl: string;
    serviceName: string;
    serviceId: string;  // Added this property to the interface
  }
  
  /**
   * Map of domains to their corresponding bypass services
   */
  const DOMAIN_BYPASS_MAP: Record<string, { service: string, name: string }> = {
    // Medium sites
    'medium.com': { service: 'scribe', name: 'Scribe.rip' },
    'towardsdatascience.com': { service: 'scribe', name: 'Scribe.rip' },
    'betterprogramming.pub': { service: 'scribe', name: 'Scribe.rip' },
    'uxdesign.cc': { service: 'scribe', name: 'Scribe.rip' },
    'bettermarketing.pub': { service: 'scribe', name: 'Scribe.rip' },
    'levelup.gitconnected.com': { service: 'scribe', name: 'Scribe.rip' },
    
    // NYT and related
    'nytimes.com': { service: '12ft', name: '12ft.io' },
    'nyt.com': { service: '12ft', name: '12ft.io' },
    
    // Financial publications
    'economist.com': { service: 'archive.is', name: 'Archive.is' },
    'ft.com': { service: 'archive.is', name: 'Archive.is' },
    'wsj.com': { service: 'archive.ph', name: 'Archive.ph' },
    'forbes.com': { service: '12ft', name: '12ft.io' },
    
    // News sites
    'washingtonpost.com': { service: '12ft', name: '12ft.io' },
    'latimes.com': { service: '12ft', name: '12ft.io' },
    'chicagotribune.com': { service: '12ft', name: '12ft.io' },
    'theguardian.com': { service: '12ft', name: '12ft.io' },
    'bloomberg.com': { service: '12ft', name: '12ft.io' },
    'businessinsider.com': { service: '12ft', name: '12ft.io' },
    'theatlantic.com': { service: '12ft', name: '12ft.io' },
    
    // Science publications
    'scientificamerican.com': { service: '12ft', name: '12ft.io' },
    'nature.com': { service: '12ft', name: '12ft.io' },
    'science.org': { service: '12ft', name: '12ft.io' },
    
    // Sports
    'theathletic.com': { service: 'archive.is', name: 'Archive.is' },
    'espn.com': { service: '12ft', name: '12ft.io' },
  };
  
  /**
   * Determine the best bypass service for a given URL
   */
  export function determineBypassService(url: string): BypassResult {
    try {
      const urlObj = new URL(url);
      let hostname = urlObj.hostname.toLowerCase();
      
      // Remove www. prefix if present
      if (hostname.startsWith('www.')) {
        hostname = hostname.substring(4);
      }
      
      // Look for exact domain matches
      for (const domain in DOMAIN_BYPASS_MAP) {
        if (hostname === domain) {
          const { service, name } = DOMAIN_BYPASS_MAP[domain];
          return {
            serviceUrl: createBypassUrl(url, service),
            serviceName: name,
            serviceId: service
          };
        }
      }
      
      // Look for partial domain matches
      for (const domain in DOMAIN_BYPASS_MAP) {
        if (hostname.includes(domain)) {
          const { service, name } = DOMAIN_BYPASS_MAP[domain];
          return {
            serviceUrl: createBypassUrl(url, service),
            serviceName: name,
            serviceId: service
          };
        }
      }
      
      // Default to 12ft.io for unknown sites
      return {
        serviceUrl: createBypassUrl(url, '12ft'),
        serviceName: '12ft.io',
        serviceId: '12ft'
      };
    } catch (error) {
      // Default to 12ft.io if URL parsing fails
      return {
        serviceUrl: createBypassUrl(url, '12ft'),
        serviceName: '12ft.io',
        serviceId: '12ft'
      };
    }
  }
  
  /**
   * Create the bypass URL based on the service
   */
  function createBypassUrl(url: string, service: string): string {
    switch (service) {
      case 'scribe':
        // For Scribe.rip, extract the path from Medium URLs
        try {
          const urlObj = new URL(url);
          return `https://scribe.rip${urlObj.pathname}`;
        } catch (e) {
          // If URL parsing fails, use the full URL
          return `https://scribe.rip/${url.replace(/^https?:\/\/(www\.)?medium\.com\//, '')}`;
        }
        
      case 'archive.is':
        return `https://archive.is/${url}`;
        
      case 'archive.ph':
        return `https://archive.ph/${url}`;
        
      case '12ft':
      default:
        return `https://12ft.io/${url}`;
    }
  }