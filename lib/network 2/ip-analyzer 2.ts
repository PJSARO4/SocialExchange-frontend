/**
 * IP & Network Analysis Service
 *
 * Provides comprehensive internet connection data:
 * - IP address (public & local)
 * - Geolocation
 * - ISP information
 * - Connection quality metrics
 * - Security analysis
 */

// ============================================
// TYPES
// ============================================

export interface IPInfo {
  ip: string;
  version: 'IPv4' | 'IPv6';
  type: 'public' | 'local';
}

export interface GeoLocation {
  city: string;
  region: string;
  regionCode: string;
  country: string;
  countryCode: string;
  continent: string;
  latitude: number;
  longitude: number;
  timezone: string;
  postalCode?: string;
}

export interface ISPInfo {
  name: string;
  organization: string;
  asn: string;
  asnName: string;
  connectionType?: 'residential' | 'business' | 'mobile' | 'datacenter';
}

export interface ConnectionQuality {
  latency: number;           // ms
  downloadSpeed?: number;    // Mbps
  uploadSpeed?: number;      // Mbps
  jitter?: number;           // ms
  packetLoss?: number;       // percentage
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface SecurityAnalysis {
  isVPN: boolean;
  isProxy: boolean;
  isTor: boolean;
  isDatacenter: boolean;
  threatLevel: 'none' | 'low' | 'medium' | 'high';
  threats: string[];
  recommendations: string[];
}

export interface BrowserInfo {
  userAgent: string;
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  device: string;
  isMobile: boolean;
  language: string;
  languages: string[];
  cookiesEnabled: boolean;
  doNotTrack: boolean;
  screenResolution: string;
  colorDepth: number;
  timezone: string;
  timezoneOffset: number;
}

export interface NetworkInfo {
  ip: IPInfo;
  geo: GeoLocation;
  isp: ISPInfo;
  connection: ConnectionQuality;
  security: SecurityAnalysis;
  browser: BrowserInfo;
  timestamp: string;
}

// ============================================
// BROWSER INFO DETECTION
// ============================================

export function getBrowserInfo(): BrowserInfo {
  if (typeof window === 'undefined') {
    return getDefaultBrowserInfo();
  }

  const ua = navigator.userAgent;
  const { browser, version: browserVersion } = detectBrowser(ua);
  const { os, version: osVersion } = detectOS(ua);
  const device = detectDevice(ua);

  return {
    userAgent: ua,
    browser,
    browserVersion,
    os,
    osVersion,
    device,
    isMobile: /Mobile|Android|iPhone|iPad/i.test(ua),
    language: navigator.language,
    languages: Array.from(navigator.languages || [navigator.language]),
    cookiesEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack === '1',
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    colorDepth: window.screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
  };
}

function getDefaultBrowserInfo(): BrowserInfo {
  return {
    userAgent: 'Unknown',
    browser: 'Unknown',
    browserVersion: 'Unknown',
    os: 'Unknown',
    osVersion: 'Unknown',
    device: 'Unknown',
    isMobile: false,
    language: 'en-US',
    languages: ['en-US'],
    cookiesEnabled: false,
    doNotTrack: false,
    screenResolution: 'Unknown',
    colorDepth: 24,
    timezone: 'UTC',
    timezoneOffset: 0,
  };
}

function detectBrowser(ua: string): { browser: string; version: string } {
  const browsers = [
    { name: 'Chrome', regex: /Chrome\/(\d+\.\d+)/ },
    { name: 'Firefox', regex: /Firefox\/(\d+\.\d+)/ },
    { name: 'Safari', regex: /Version\/(\d+\.\d+).*Safari/ },
    { name: 'Edge', regex: /Edg\/(\d+\.\d+)/ },
    { name: 'Opera', regex: /OPR\/(\d+\.\d+)/ },
    { name: 'IE', regex: /MSIE (\d+\.\d+)/ },
  ];

  for (const { name, regex } of browsers) {
    const match = ua.match(regex);
    if (match) {
      return { browser: name, version: match[1] };
    }
  }

  return { browser: 'Unknown', version: 'Unknown' };
}

function detectOS(ua: string): { os: string; version: string } {
  const systems = [
    { name: 'Windows', regex: /Windows NT (\d+\.\d+)/ },
    { name: 'macOS', regex: /Mac OS X (\d+[._]\d+)/ },
    { name: 'iOS', regex: /iPhone OS (\d+_\d+)/ },
    { name: 'Android', regex: /Android (\d+\.\d+)/ },
    { name: 'Linux', regex: /Linux/ },
  ];

  for (const { name, regex } of systems) {
    const match = ua.match(regex);
    if (match) {
      return { os: name, version: match[1]?.replace(/_/g, '.') || '' };
    }
  }

  return { os: 'Unknown', version: '' };
}

function detectDevice(ua: string): string {
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/iPad/i.test(ua)) return 'iPad';
  if (/Android.*Mobile/i.test(ua)) return 'Android Phone';
  if (/Android/i.test(ua)) return 'Android Tablet';
  if (/Macintosh/i.test(ua)) return 'Mac';
  if (/Windows/i.test(ua)) return 'Windows PC';
  if (/Linux/i.test(ua)) return 'Linux PC';
  return 'Unknown';
}

// ============================================
// CONNECTION QUALITY MEASUREMENT
// ============================================

export async function measureConnectionQuality(): Promise<ConnectionQuality> {
  const latencies: number[] = [];
  const testUrls = [
    'https://www.google.com/favicon.ico',
    'https://www.cloudflare.com/favicon.ico',
  ];

  // Measure latency with multiple pings
  for (let i = 0; i < 3; i++) {
    const url = testUrls[i % testUrls.length];
    const start = performance.now();
    try {
      await fetch(`${url}?t=${Date.now()}`, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store'
      });
      const end = performance.now();
      latencies.push(end - start);
    } catch {
      // If fetch fails, add a high latency
      latencies.push(500);
    }
  }

  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const jitter = Math.max(...latencies) - Math.min(...latencies);

  // Determine quality based on latency
  let quality: ConnectionQuality['quality'];
  if (avgLatency < 50) quality = 'excellent';
  else if (avgLatency < 100) quality = 'good';
  else if (avgLatency < 200) quality = 'fair';
  else quality = 'poor';

  // Try to get connection info from Network Information API
  let downloadSpeed: number | undefined;
  let connectionType: string | undefined;

  if ('connection' in navigator) {
    const conn = (navigator as any).connection;
    if (conn) {
      downloadSpeed = conn.downlink; // Mbps
      connectionType = conn.effectiveType;
    }
  }

  return {
    latency: Math.round(avgLatency),
    downloadSpeed,
    jitter: Math.round(jitter),
    quality,
  };
}

// ============================================
// IP & GEO FETCHING
// ============================================

export async function fetchIPInfo(): Promise<{
  ip: IPInfo;
  geo: GeoLocation;
  isp: ISPInfo;
  security: SecurityAnalysis;
} | null> {
  try {
    // Use ipapi.co for comprehensive data (free tier: 1000/day)
    const response = await fetch('https://ipapi.co/json/', {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('IP lookup failed');
    }

    const data = await response.json();

    const ip: IPInfo = {
      ip: data.ip,
      version: data.version === 'IPv6' ? 'IPv6' : 'IPv4',
      type: 'public',
    };

    const geo: GeoLocation = {
      city: data.city || 'Unknown',
      region: data.region || 'Unknown',
      regionCode: data.region_code || '',
      country: data.country_name || 'Unknown',
      countryCode: data.country_code || '',
      continent: data.continent_code || '',
      latitude: data.latitude || 0,
      longitude: data.longitude || 0,
      timezone: data.timezone || 'UTC',
      postalCode: data.postal,
    };

    const isp: ISPInfo = {
      name: data.org || 'Unknown',
      organization: data.org || 'Unknown',
      asn: data.asn || '',
      asnName: data.asn || '',
      connectionType: detectConnectionType(data.org || ''),
    };

    // Basic security analysis
    const security = analyzeSecurityFromISP(data.org || '', data.ip);

    return { ip, geo, isp, security };
  } catch (error) {
    console.error('Failed to fetch IP info:', error);
    return null;
  }
}

function detectConnectionType(org: string): ISPInfo['connectionType'] {
  const lower = org.toLowerCase();
  if (lower.includes('mobile') || lower.includes('cellular') || lower.includes('wireless')) {
    return 'mobile';
  }
  if (lower.includes('amazon') || lower.includes('google') || lower.includes('microsoft') ||
      lower.includes('digitalocean') || lower.includes('linode') || lower.includes('vultr')) {
    return 'datacenter';
  }
  if (lower.includes('business') || lower.includes('enterprise') || lower.includes('corporate')) {
    return 'business';
  }
  return 'residential';
}

function analyzeSecurityFromISP(org: string, ip: string): SecurityAnalysis {
  const lower = org.toLowerCase();
  const threats: string[] = [];
  const recommendations: string[] = [];

  // VPN/Proxy detection (basic heuristics)
  const isVPN = /vpn|private|tunnel|nord|express|surf/i.test(lower);
  const isProxy = /proxy|cloudflare|akamai/i.test(lower);
  const isTor = /tor|exit/i.test(lower);
  const isDatacenter = /amazon|google|microsoft|digitalocean|linode|vultr|ovh|hetzner/i.test(lower);

  // Analyze threats
  if (isVPN) {
    threats.push('VPN connection detected');
    recommendations.push('VPN may affect some features that require location verification');
  }
  if (isProxy) {
    threats.push('Proxy or CDN detected');
  }
  if (isTor) {
    threats.push('Tor exit node detected');
    recommendations.push('Tor connections may experience slower speeds');
  }
  if (isDatacenter) {
    threats.push('Datacenter IP detected');
    recommendations.push('Datacenter IPs may be flagged by some services');
  }

  // Determine threat level
  let threatLevel: SecurityAnalysis['threatLevel'] = 'none';
  if (isTor) threatLevel = 'high';
  else if (isDatacenter && !isVPN) threatLevel = 'medium';
  else if (isVPN || isProxy) threatLevel = 'low';

  // Add general recommendations
  if (threats.length === 0) {
    recommendations.push('Your connection appears to be a standard residential connection');
  }

  return {
    isVPN,
    isProxy,
    isTor,
    isDatacenter,
    threatLevel,
    threats,
    recommendations,
  };
}

// ============================================
// FULL NETWORK ANALYSIS
// ============================================

export async function getFullNetworkAnalysis(): Promise<NetworkInfo> {
  // Get browser info (sync)
  const browser = getBrowserInfo();

  // Fetch IP info and measure connection in parallel
  const [ipData, connection] = await Promise.all([
    fetchIPInfo(),
    measureConnectionQuality(),
  ]);

  // Default values if IP lookup fails
  const defaultIP: IPInfo = { ip: 'Unknown', version: 'IPv4', type: 'public' };
  const defaultGeo: GeoLocation = {
    city: 'Unknown',
    region: 'Unknown',
    regionCode: '',
    country: 'Unknown',
    countryCode: '',
    continent: '',
    latitude: 0,
    longitude: 0,
    timezone: browser.timezone,
  };
  const defaultISP: ISPInfo = {
    name: 'Unknown',
    organization: 'Unknown',
    asn: '',
    asnName: '',
  };
  const defaultSecurity: SecurityAnalysis = {
    isVPN: false,
    isProxy: false,
    isTor: false,
    isDatacenter: false,
    threatLevel: 'none',
    threats: [],
    recommendations: ['Unable to analyze connection security'],
  };

  return {
    ip: ipData?.ip || defaultIP,
    geo: ipData?.geo || defaultGeo,
    isp: ipData?.isp || defaultISP,
    connection,
    security: ipData?.security || defaultSecurity,
    browser,
    timestamp: new Date().toISOString(),
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function getQualityColor(quality: ConnectionQuality['quality']): string {
  switch (quality) {
    case 'excellent': return '#34d399';
    case 'good': return '#60a5fa';
    case 'fair': return '#fbbf24';
    case 'poor': return '#f87171';
    default: return '#6b7280';
  }
}

export function getThreatColor(level: SecurityAnalysis['threatLevel']): string {
  switch (level) {
    case 'none': return '#34d399';
    case 'low': return '#60a5fa';
    case 'medium': return '#fbbf24';
    case 'high': return '#f87171';
    default: return '#6b7280';
  }
}

export function formatLatency(ms: number): string {
  if (ms < 50) return `${ms}ms (Excellent)`;
  if (ms < 100) return `${ms}ms (Good)`;
  if (ms < 200) return `${ms}ms (Fair)`;
  return `${ms}ms (Poor)`;
}

export function getConnectionIcon(type?: ISPInfo['connectionType']): string {
  switch (type) {
    case 'mobile': return '📱';
    case 'business': return '🏢';
    case 'datacenter': return '🖥️';
    default: return '🏠';
  }
}
