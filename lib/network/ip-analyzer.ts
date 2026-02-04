// Stub file - IP Analyzer

export interface NetworkInfo {
  ip: string;
  country?: string;
  city?: string;
  isp?: string;
  connectionType?: string;
  latency?: number;
}

export interface NetworkAnalysis {
  info: NetworkInfo;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  score: number;
  timestamp: Date;
}

export async function getFullNetworkAnalysis(): Promise<NetworkAnalysis> {
  // Stub - returns mock data
  return {
    info: {
      ip: '0.0.0.0',
      country: 'Unknown',
      city: 'Unknown',
      isp: 'Unknown',
      connectionType: 'Unknown',
      latency: 0,
    },
    quality: 'good',
    score: 75,
    timestamp: new Date(),
  };
}

export async function measureConnectionQuality(): Promise<'excellent' | 'good' | 'fair' | 'poor'> {
  // Stub - returns mock quality
  return 'good';
}

export async function getNetworkInfo(): Promise<NetworkInfo> {
  // Stub - returns mock info
  return {
    ip: '0.0.0.0',
    country: 'Unknown',
  };
}

// Get icon for connection type
export function getConnectionIcon(connectionType: string): string {
  const icons: Record<string, string> = {
    wifi: '📶',
    cellular: '📱',
    ethernet: '🔌',
    unknown: '🌐',
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
