// Stub file - IP Analyzer

export interface IPInfo {
  ip: string;
  version: string;
}

export interface GeoInfo {
  country: string;
  countryCode: string;
  region: string;
  regionCode: string;
  city: string;
  postalCode?: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface ISPInfo {
  name: string;
  connectionType: string;
  asn?: string;
}

export interface ConnectionInfo {
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  latency: number;
  downloadSpeed?: number;
  jitter?: number;
}

export interface SecurityInfo {
  threatLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  isVPN: boolean;
  isProxy: boolean;
  isTor: boolean;
  isDatacenter: boolean;
  threats: string[];
  recommendations: string[];
}

export interface BrowserInfo {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  device: string;
  screenResolution: string;
  colorDepth: number;
  language: string;
  timezone: string;
  cookiesEnabled: boolean;
  doNotTrack: boolean;
  isMobile: boolean;
  userAgent: string;
}

export interface NetworkInfo {
  ip: IPInfo;
  geo: GeoInfo;
  isp: ISPInfo;
  connection: ConnectionInfo;
  security: SecurityInfo;
  browser: BrowserInfo;
  timestamp: Date;
}

export interface NetworkAnalysis {
  info: NetworkInfo;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  score: number;
  timestamp: Date;
}

export async function getFullNetworkAnalysis(): Promise<NetworkInfo> {
  // Stub - returns mock data
  return {
    ip: {
      ip: '0.0.0.0',
      version: 'IPv4',
    },
    geo: {
      country: 'Unknown',
      countryCode: 'US',
      region: 'Unknown',
      regionCode: 'US',
      city: 'Unknown',
      latitude: 0,
      longitude: 0,
      timezone: 'UTC',
    },
    isp: {
      name: 'Unknown ISP',
      connectionType: 'Unknown',
    },
    connection: {
      quality: 'good',
      latency: 0,
    },
    security: {
      threatLevel: 'none',
      isVPN: false,
      isProxy: false,
      isTor: false,
      isDatacenter: false,
      threats: [],
      recommendations: [],
    },
    browser: {
      browser: 'Unknown',
      browserVersion: '0.0.0',
      os: 'Unknown',
      osVersion: '0.0.0',
      device: 'Unknown',
      screenResolution: '0x0',
      colorDepth: 24,
      language: 'en',
      timezone: 'UTC',
      cookiesEnabled: true,
      doNotTrack: false,
      isMobile: false,
      userAgent: '',
    },
    timestamp: new Date(),
  };
}

export async function measureConnectionQuality(): Promise<ConnectionInfo> {
  // Stub - returns mock quality
  return {
    quality: 'good',
    latency: 0,
  };
}

export async function getNetworkInfo(): Promise<NetworkInfo> {
  // Stub - returns mock info
  return {
    ip: {
      ip: '0.0.0.0',
      version: 'IPv4',
    },
    geo: {
      country: 'Unknown',
      countryCode: 'US',
      region: 'Unknown',
      regionCode: 'US',
      city: 'Unknown',
      latitude: 0,
      longitude: 0,
      timezone: 'UTC',
    },
    isp: {
      name: 'Unknown ISP',
      connectionType: 'Unknown',
    },
    connection: {
      quality: 'good',
      latency: 0,
    },
    security: {
      threatLevel: 'none',
      isVPN: false,
      isProxy: false,
      isTor: false,
      isDatacenter: false,
      threats: [],
      recommendations: [],
    },
    browser: {
      browser: 'Unknown',
      browserVersion: '0.0.0',
      os: 'Unknown',
      osVersion: '0.0.0',
      device: 'Unknown',
      screenResolution: '0x0',
      colorDepth: 24,
      language: 'en',
      timezone: 'UTC',
      cookiesEnabled: true,
      doNotTrack: false,
      isMobile: false,
      userAgent: '',
    },
    timestamp: new Date(),
  };
}

// Get icon for connection type
export function getConnectionIcon(connectionType: string): string {
  const icons: Record<string, string> = {
    wifi: 'wifi',
    cellular: 'smartphone',
    ethernet: 'plug',
    unknown: 'globe',
  };
  return icons[connectionType?.toLowerCase()] || icons.unknown;
}

// Get color for quality level
export function getQualityColor(quality: 'excellent' | 'good' | 'fair' | 'poor'): string {
  const colors: Record<string, string> = {
    excellent: 'text-green-500',
    good: 'text-blue-500',
    fair: 'text-yellow-500',
    poor: 'text-red-500',
  };
  return colors[quality] || colors.fair;
}

// Get color for threat level
export function getThreatColor(threatLevel: 'none' | 'low' | 'medium' | 'high' | 'critical'): string {
  const colors: Record<string, string> = {
    none: 'text-green-500',
    low: 'text-blue-500',
    medium: 'text-yellow-500',
    high: 'text-orange-500',
    critical: 'text-red-500',
  };
  return colors[threatLevel] || colors.medium;
}

export default { getFullNetworkAnalysis, measureConnectionQuality, getNetworkInfo, getConnectionIcon, getQualityColor, getThreatColor };
