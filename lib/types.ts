/**
 * Type for bypass method functions
 */
export type BypassMethods = (url: string) => Promise<string>;

/**
 * Interface for the response from bypass API
 */
export interface BypassResponse {
  bypassedUrl: string;
  methodUsed?: string;
  fallbackOptions?: string[];
}

/**
 * Interface for error response from API
 */
export interface ErrorResponse {
  message: string;
  error?: string;
}

/**
 * Interface for proxy options
 */
export interface ProxyOptions {
  method: 'googlebot' | 'facebook' | 'twitter' | 'nyt-facebook' | 'headers' | 'incognito';
  userAgent?: string;
  referrer?: string;
  cookies?: Record<string, string>;
  headers?: Record<string, string>;
}

/**
 * Types of publications with specialized bypass strategies
 */
export enum PublicationType {
  NYTimes = 'nytimes',
  WSJ = 'wsj',
  WashingtonPost = 'washingtonpost',
  Medium = 'medium',
  Economist = 'economist',
  FinancialTimes = 'ft',
  Other = 'other'
}
