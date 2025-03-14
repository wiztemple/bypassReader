"use client";

import { useState, FormEvent, useEffect } from 'react';
import { determineBypassService } from '@/lib/bypass-service';
import { useBypassAnalytics, useBypassCache } from '@/lib/analytics-cache';
import AnalyticsView from './components/AnalyticsView';
import { X } from 'lucide-react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRedirect, setLastRedirect] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [feedback, setFeedback] = useState<'success' | 'failure' | null>(null);
  const [recentUrls, setRecentUrls] = useState<string[]>([]);
  const [lastService, setLastService] = useState<string>('');
  
  // Initialize analytics and cache hooks
  const { analytics, recordAttempt, recordSuccess, recordFailure, getRecommendedService } = useBypassAnalytics();
  const { cache, getCachedService, cacheUrl } = useBypassCache();
  
  // Load recent URLs from local storage
  useEffect(() => {
    try {
      const storedUrls = localStorage.getItem('recent_urls');
      if (storedUrls) {
        setRecentUrls(JSON.parse(storedUrls));
      }
    } catch (error) {
      console.error('Failed to load recent URLs:', error);
    }
  }, []);
  
  // Handle form submission
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!url) return;
    
    setLoading(true);
    setError(null);
    setFeedback(null);
    
    try {
      // Format URL if needed
      let formattedUrl = url;
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = `https://${formattedUrl}`;
      }
      
      // Validate URL
      const urlObj = new URL(formattedUrl);
      let hostname = urlObj.hostname.toLowerCase();
      
      // Remove www. prefix if present
      if (hostname.startsWith('www.')) {
        hostname = hostname.substring(4);
      }
      
      // Check cache first
      const cachedResult = getCachedService(formattedUrl);
      let serviceResult;
      
      if (cachedResult && cachedResult.successful) {
        // Use cached successful service
        const serviceName = cachedResult.service === 'scribe' ? 'Scribe.rip' :
                           cachedResult.service === '12ft' ? '12ft.io' :
                           cachedResult.service === 'archive.is' ? 'Archive.is' :
                           cachedResult.service === 'archive.ph' ? 'Archive.ph' : 'Unknown';
                           
        serviceResult = {
          serviceUrl: createServiceUrl(formattedUrl, cachedResult.service),
          serviceName,
          serviceId: cachedResult.service
        };
        
        setLastRedirect(`${serviceResult.serviceName} (cached): ${serviceResult.serviceUrl}`);
      } else {
        // Check if analytics recommends a different service than the default
        const { serviceUrl, serviceName, serviceId } = determineBypassService(formattedUrl);
        const recommendedService = getRecommendedService(hostname, serviceId);
        
        if (recommendedService !== serviceId) {
          // Use recommended service instead
          serviceResult = {
            serviceUrl: createServiceUrl(formattedUrl, recommendedService),
            serviceName: recommendedService === 'scribe' ? 'Scribe.rip' :
                        recommendedService === '12ft' ? '12ft.io' :
                        recommendedService === 'archive.is' ? 'Archive.is' :
                        recommendedService === 'archive.ph' ? 'Archive.ph' : 'Unknown',
            serviceId: recommendedService
          };
          setLastRedirect(`${serviceResult.serviceName} (recommended): ${serviceResult.serviceUrl}`);
        } else {
          // Use default service
          serviceResult = { serviceUrl, serviceName, serviceId };
          setLastRedirect(`${serviceName}: ${serviceUrl}`);
        }
      }
      
      // Save the service we used for feedback
      setLastService(serviceResult.serviceId);
      
      // Record the attempt in analytics
      recordAttempt(hostname, serviceResult.serviceId);
      
      // Save to recent URLs
      const updatedRecentUrls = [formattedUrl, ...recentUrls.filter(u => u !== formattedUrl)].slice(0, 10);
      setRecentUrls(updatedRecentUrls);
      localStorage.setItem('recent_urls', JSON.stringify(updatedRecentUrls));
      
      // Open in new tab
      window.open(serviceResult.serviceUrl, '_blank');
      
      setLoading(false);
    } catch (err) {
      setError('Please enter a valid URL');
      setLoading(false);
    }
  };
  
  // Handle clear input
  const handleClearInput = () => {
    setUrl('');
    setError(null);
  };
  
  // Handle success/failure feedback
  const handleFeedback = (type: 'success' | 'failure') => {
    if (!url || !lastService) return;
    
    setFeedback(type);
    
    try {
      const urlObj = new URL(url);
      let hostname = urlObj.hostname.toLowerCase();
      if (hostname.startsWith('www.')) {
        hostname = hostname.substring(4);
      }
      
      if (type === 'success') {
        recordSuccess(hostname, lastService);
        cacheUrl(url, lastService, true);
      } else {
        recordFailure(hostname, lastService);
        cacheUrl(url, lastService, false);
      }
    } catch (error) {
      console.error('Error processing feedback:', error);
    }
  };
  
  // Helper function to create service URL
  const createServiceUrl = (targetUrl: string, service: string): string => {
    switch (service) {
      case 'scribe':
        try {
          const urlObj = new URL(targetUrl);
          return `https://scribe.rip${urlObj.pathname}`;
        } catch (e) {
          return `https://scribe.rip/${targetUrl.replace(/^https?:\/\/(www\.)?medium\.com\//, '')}`;
        }
      case 'archive.is':
        return `https://archive.is/${targetUrl}`;
      case 'archive.ph':
        return `https://archive.ph/${targetUrl}`;
      case '12ft':
      default:
        return `https://12ft.io/${targetUrl}`;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      <style jsx global>{`
        /* Hide datalist dropdown indicator */
        input::-webkit-calendar-picker-indicator {
          display: none !important;
          opacity: 0;
        }
        
        input[list]::-webkit-list-button {
          display: none !important;
        }
        
        /* Apply 12ft.io font family */
        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
      `}</style>
      <header className="bg-white border-b border-gray-100 py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-normal text-gray-900">Bypass<span className="font-medium">Reader</span></h1>
            <div className="flex space-x-4">
              <button 
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <section className="py-24 bg-white text-gray-900">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <h2 className="text-4xl font-normal mb-6">Paywall Bypasser</h2>
            <p className="text-lg mb-16 text-gray-600 max-w-xl mx-auto">
              The smart way to read paywalled content
            </p>
            
            <div className="mx-auto bg-white p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="url-input" className="block text-left text-gray-600 text-sm font-medium mb-2">
                    Article URL
                  </label>
                  <div className="relative">
                    <input
                      id="url-input"
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="Paste article URL here (e.g., nytimes.com/article...)"
                      className="w-full px-4 py-3 border border-gray-200 rounded-full focus:border-gray-300 outline-none text-gray-700"
                      spellCheck="false"
                      autoComplete="off"
                      list=""
                    />
                    {url && (
                      <button
                        type="button"
                        onClick={handleClearInput}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-800 hover:text-gray-600 bg-transparent border-none cursor-pointer p-1 rounded-full hover:bg-gray-50"
                        aria-label="Clear input"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  {error && (
                    <p className="mt-2 text-left text-red-600 text-sm">{error}</p>
                  )}
                </div>
                
                <button
                  type="submit"
                  disabled={loading || !url}
                  className={`w-full py-3 px-4 rounded-3xl text-white font-normal transition-colors focus:outline-none
                    ${loading || !url
                      ? 'bg-gray-300 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-900 hover:bg-black'
                    }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Redirecting...
                    </span>
                  ) : (
                    'Read Article'
                  )}
                </button>
              </form>
              
              {lastRedirect && (
                <div className="mt-6 border-t border-gray-50 pt-4">
                  <p className="text-sm text-gray-400 mb-2">Last redirect:</p>
                  <p className="text-sm text-gray-600 break-all">{lastRedirect}</p>
                  
                  {!feedback && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-400 mb-2">Did it work?</p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleFeedback('success')}
                          className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded hover:bg-gray-200 transition-colors"
                        >
                          Yes, it worked
                        </button>
                        <button
                          onClick={() => handleFeedback('failure')}
                          className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded hover:bg-gray-200 transition-colors"
                        >
                          No, still paywalled
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {feedback === 'success' && (
                    <p className="mt-2 text-sm text-gray-600">
                      Great! We'll remember this for future articles.
                    </p>
                  )}
                  
                  {feedback === 'failure' && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-2">
                        Sorry about that. Try one of these alternatives:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => window.open(`https://12ft.io/${url}`, '_blank')}
                          className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 transition-colors"
                        >
                          Try 12ft.io
                        </button>
                        <button
                          onClick={() => window.open(`https://archive.is/${url}`, '_blank')}
                          className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 transition-colors"
                        >
                          Try Archive.is
                        </button>
                        <button
                          onClick={() => {
                            try {
                              const urlObj = new URL(url);
                              window.open(`https://scribe.rip${urlObj.pathname}`, '_blank');
                            } catch (e) {
                              window.open(`https://scribe.rip/${url}`, '_blank');
                            }
                          }}
                          className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 transition-colors"
                        >
                          Try Scribe.rip
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
        
        {showAnalytics && (
          <section className="py-12 bg-gray-50">
            <div className="container mx-auto px-4 max-w-4xl">
              <h2 className="text-2xl font-normal text-center text-gray-900 mb-12">Bypass Analytics</h2>
              <AnalyticsView analytics={analytics} />
            </div>
          </section>
        )}
        
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-light text-center text-gray-800 mb-12">Supported Publications</h2>
            
            <div className="max-w-4xl mx-auto bg-white rounded-lg overflow-hidden border border-gray-100">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wide">
                      Publication
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wide">
                      Default Service
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wide">
                      Success Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {/* Medium sites */}
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-900">
                      Medium and Medium publications
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Scribe.rip
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {analytics.domainStats['medium.com'] ? (
                        <span>
                          {Math.min(analytics.domainStats['medium.com'].successRate, 100)}%
                        </span>
                      ) : (
                        <span className="text-gray-400">
                          No data
                        </span>
                      )}
                    </td>
                  </tr>
                  
                  {/* NYT */}
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                      The New York Times
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      12ft.io
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {analytics.domainStats['nytimes.com'] ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          {Math.min(analytics.domainStats['nytimes.com'].successRate, 100)}%
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-500">
                          No data
                        </span>
                      )}
                    </td>
                  </tr>
                  
                  {/* Economist */}
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                      The Economist, Financial Times
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Archive.is
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {analytics.domainStats['economist.com'] ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          {Math.min(analytics.domainStats['economist.com'].successRate, 100)}%
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-500">
                          No data
                        </span>
                      )}
                    </td>
                  </tr>
                  
                  {/* WSJ */}
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                      Wall Street Journal
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Archive.ph
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {analytics.domainStats['wsj.com'] ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          {Math.min(analytics.domainStats['wsj.com'].successRate, 100)}%
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-500">
                          No data
                        </span>
                      )}
                    </td>
                  </tr>
                  
                  {/* WaPo */}
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                      Washington Post, LA Times
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      12ft.io
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {analytics.domainStats['washingtonpost.com'] ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          {Math.min(analytics.domainStats['washingtonpost.com'].successRate, 100)}%
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-500">
                          No data
                        </span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white text-gray-500 py-8 border-t border-gray-200">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} BypassReader. For educational purposes only.
          </p>
          <p className="text-sm mt-2">
            We don't host any bypassed content - we just point to the best service for each site.
          </p>
        </div>
      </footer>
    </div>
  );
}