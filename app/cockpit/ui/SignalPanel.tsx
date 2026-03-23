'use client';

import { useEffect, useState, useCallback, ReactNode } from 'react';
import {
  NetworkInfo,
  getFullNetworkAnalysis,
  measureConnectionQuality,
  getQualityColor,
  getThreatColor,
  getConnectionIcon,
} from '@/lib/network/ip-analyzer';
import {
  AlertTriangle,
  Radio,
  RefreshCw,
  Globe,
  Zap,
  Rocket,
  Building2,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Lock,
  Shield,
  Monitor,
  Lightbulb,
  Smartphone,
  MapPin,
  Compass,
  Check,
} from 'lucide-react';
import './signal-panel.css';

// ============================================
// COMPONENT
// ============================================

export default function SignalPanel() {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'location' | 'security' | 'browser'>('overview');

  const fetchNetworkData = useCallback(async () => {
    try {
      setError(null);
      const data = await getFullNetworkAnalysis();
      setNetworkInfo(data);
    } catch (err) {
      setError('Failed to analyze network');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNetworkData();
  }, [fetchNetworkData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNetworkData();
  };

  const handleSpeedTest = async () => {
    if (!networkInfo) return;
    setRefreshing(true);
    const connection = await measureConnectionQuality();
    setNetworkInfo((prev) => prev ? { ...prev, connection } : null);
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="signal-panel">
        <div className="signal-loading">
          <div className="signal-loading-spinner" />
          <span>Analyzing connection...</span>
        </div>
      </div>
    );
  }

  if (error || !networkInfo) {
    return (
      <div className="signal-panel">
        <div className="signal-error">
          <span className="signal-error-icon"><AlertTriangle size={18} /></span>
          <p>{error || 'Unable to analyze network'}</p>
          <button onClick={fetchNetworkData} className="signal-retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { ip, geo, isp, connection, security, browser } = networkInfo;

  return (
    <div className="signal-panel">
      {/* Header */}
      <header className="signal-header">
        <div className="signal-header-left">
          <span className="signal-icon"><Radio size={18} /></span>
          <h2>Network Signal</h2>
          <span
            className="signal-quality-badge"
            style={{ '--quality-color': getQualityColor(connection.quality) } as React.CSSProperties}
          >
            {connection.quality.toUpperCase()}
          </span>
        </div>
        <div className="signal-header-right">
          <button
            className={`signal-refresh-btn ${refreshing ? 'refreshing' : ''}`}
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="signal-tabs">
        <button
          className={`signal-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`signal-tab ${activeTab === 'location' ? 'active' : ''}`}
          onClick={() => setActiveTab('location')}
        >
          Location
        </button>
        <button
          className={`signal-tab ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          Security
        </button>
        <button
          className={`signal-tab ${activeTab === 'browser' ? 'active' : ''}`}
          onClick={() => setActiveTab('browser')}
        >
          Browser
        </button>
      </nav>

      {/* Content */}
      <div className="signal-content">
        {activeTab === 'overview' && (
          <div className="signal-overview">
            {/* IP Card */}
            <div className="signal-card ip-card">
              <div className="signal-card-header">
                <span className="signal-card-icon"><Globe size={16} /></span>
                <span className="signal-card-title">IP Address</span>
                <span className="signal-card-badge">{ip.version}</span>
              </div>
              <div className="signal-ip-value">{ip.ip}</div>
              <div className="signal-card-meta">
                {getConnectionIcon(isp.connectionType)} {isp.connectionType || 'Unknown'} connection
              </div>
            </div>

            {/* Connection Card */}
            <div className="signal-card connection-card">
              <div className="signal-card-header">
                <span className="signal-card-icon"><Zap size={16} /></span>
                <span className="signal-card-title">Connection</span>
              </div>
              <div className="signal-metrics">
                <div className="signal-metric">
                  <span className="signal-metric-label">Latency</span>
                  <span
                    className="signal-metric-value"
                    style={{ color: getQualityColor(connection.quality) }}
                  >
                    {connection.latency}ms
                  </span>
                </div>
                {connection.downloadSpeed && (
                  <div className="signal-metric">
                    <span className="signal-metric-label">Speed</span>
                    <span className="signal-metric-value">{connection.downloadSpeed} Mbps</span>
                  </div>
                )}
                {connection.jitter !== undefined && (
                  <div className="signal-metric">
                    <span className="signal-metric-label">Jitter</span>
                    <span className="signal-metric-value">{connection.jitter}ms</span>
                  </div>
                )}
              </div>
              <button className="signal-speedtest-btn" onClick={handleSpeedTest} disabled={refreshing}>
                {refreshing ? 'Testing...' : <><Rocket size={14} /> Run Speed Test</>}
              </button>
            </div>

            {/* ISP Card */}
            <div className="signal-card isp-card">
              <div className="signal-card-header">
                <span className="signal-card-icon"><Building2 size={16} /></span>
                <span className="signal-card-title">ISP</span>
              </div>
              <div className="signal-isp-name">{isp.name}</div>
              {isp.asn && (
                <div className="signal-card-meta">ASN: {isp.asn}</div>
              )}
            </div>

            {/* Quick Security Status */}
            <div
              className="signal-card security-card"
              style={{ '--threat-color': getThreatColor(security.threatLevel) } as React.CSSProperties}
            >
              <div className="signal-card-header">
                <span className="signal-card-icon"><ShieldCheck size={16} /></span>
                <span className="signal-card-title">Security</span>
                <span className="signal-threat-badge">{security.threatLevel.toUpperCase()}</span>
              </div>
              <div className="signal-security-flags">
                <span className={`signal-flag ${security.isVPN ? 'active' : ''}`}>VPN</span>
                <span className={`signal-flag ${security.isProxy ? 'active' : ''}`}>Proxy</span>
                <span className={`signal-flag ${security.isTor ? 'active' : ''}`}>Tor</span>
                <span className={`signal-flag ${security.isDatacenter ? 'active' : ''}`}>DC</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'location' && (
          <div className="signal-location">
            <div className="signal-location-header">
              <span className="signal-location-flag">
                {geo.countryCode ? getFlagEmoji(geo.countryCode) : <Globe size={20} />}
              </span>
              <div className="signal-location-text">
                <h3>{geo.city}</h3>
                <p>{geo.region}, {geo.country}</p>
              </div>
            </div>

            <div className="signal-location-details">
              <div className="signal-detail-row">
                <span className="signal-detail-label">Country</span>
                <span className="signal-detail-value">{geo.country} ({geo.countryCode})</span>
              </div>
              <div className="signal-detail-row">
                <span className="signal-detail-label">Region</span>
                <span className="signal-detail-value">{geo.region} ({geo.regionCode})</span>
              </div>
              <div className="signal-detail-row">
                <span className="signal-detail-label">City</span>
                <span className="signal-detail-value">{geo.city}</span>
              </div>
              {geo.postalCode && (
                <div className="signal-detail-row">
                  <span className="signal-detail-label">Postal Code</span>
                  <span className="signal-detail-value">{geo.postalCode}</span>
                </div>
              )}
              <div className="signal-detail-row">
                <span className="signal-detail-label">Coordinates</span>
                <span className="signal-detail-value">
                  {geo.latitude.toFixed(4)}, {geo.longitude.toFixed(4)}
                </span>
              </div>
              <div className="signal-detail-row">
                <span className="signal-detail-label">Timezone</span>
                <span className="signal-detail-value">{geo.timezone}</span>
              </div>
            </div>

            {/* Mini Map Placeholder */}
            <div className="signal-map-placeholder">
              <span><MapPin size={20} /></span>
              <p>Map view coming soon</p>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="signal-security-tab">
            <div
              className="signal-security-status"
              style={{ '--threat-color': getThreatColor(security.threatLevel) } as React.CSSProperties}
            >
              <div className="signal-security-icon">
                {security.threatLevel === 'none' ? <CheckCircle size={24} /> :
                 security.threatLevel === 'low' ? <Shield size={24} style={{ color: '#3b82f6' }} /> :
                 security.threatLevel === 'medium' ? <AlertTriangle size={24} style={{ color: '#eab308' }} /> : <XCircle size={24} style={{ color: '#ef4444' }} />}
              </div>
              <div className="signal-security-text">
                <h3>Threat Level: {security.threatLevel.toUpperCase()}</h3>
                <p>
                  {security.threatLevel === 'none' ? 'Your connection appears secure' :
                   security.threatLevel === 'low' ? 'Minor privacy features detected' :
                   security.threatLevel === 'medium' ? 'Some flags detected on your connection' :
                   'Multiple security concerns detected'}
                </p>
              </div>
            </div>

            <div className="signal-security-checks">
              <h4>Connection Analysis</h4>
              <div className="signal-check-item">
                <span className={`signal-check-icon ${security.isVPN ? 'detected' : 'clear'}`}>
                  {security.isVPN ? <Lock size={14} /> : <Check size={14} />}
                </span>
                <span className="signal-check-label">VPN</span>
                <span className="signal-check-status">
                  {security.isVPN ? 'Detected' : 'Not detected'}
                </span>
              </div>
              <div className="signal-check-item">
                <span className={`signal-check-icon ${security.isProxy ? 'detected' : 'clear'}`}>
                  {security.isProxy ? <RefreshCw size={14} /> : <Check size={14} />}
                </span>
                <span className="signal-check-label">Proxy</span>
                <span className="signal-check-status">
                  {security.isProxy ? 'Detected' : 'Not detected'}
                </span>
              </div>
              <div className="signal-check-item">
                <span className={`signal-check-icon ${security.isTor ? 'detected' : 'clear'}`}>
                  {security.isTor ? <Shield size={14} /> : <Check size={14} />}
                </span>
                <span className="signal-check-label">Tor Network</span>
                <span className="signal-check-status">
                  {security.isTor ? 'Detected' : 'Not detected'}
                </span>
              </div>
              <div className="signal-check-item">
                <span className={`signal-check-icon ${security.isDatacenter ? 'detected' : 'clear'}`}>
                  {security.isDatacenter ? <Monitor size={14} /> : <Check size={14} />}
                </span>
                <span className="signal-check-label">Datacenter IP</span>
                <span className="signal-check-status">
                  {security.isDatacenter ? 'Detected' : 'Not detected'}
                </span>
              </div>
            </div>

            {security.threats.length > 0 && (
              <div className="signal-threats">
                <h4><AlertTriangle size={16} /> Flags</h4>
                <ul>
                  {security.threats.map((threat: string, i: number) => (
                    <li key={i}>{threat}</li>
                  ))}
                </ul>
              </div>
            )}

            {security.recommendations.length > 0 && (
              <div className="signal-recommendations">
                <h4><Lightbulb size={16} /> Notes</h4>
                <ul>
                  {security.recommendations.map((rec: string, i: number) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'browser' && (
          <div className="signal-browser-tab">
            <div className="signal-browser-header">
              <span className="signal-browser-icon">
                {getBrowserIcon(browser.browser)}
              </span>
              <div className="signal-browser-text">
                <h3>{browser.browser} {browser.browserVersion}</h3>
                <p>{browser.os} {browser.osVersion}</p>
              </div>
            </div>

            <div className="signal-browser-details">
              <div className="signal-detail-row">
                <span className="signal-detail-label">Device</span>
                <span className="signal-detail-value">{browser.device}</span>
              </div>
              <div className="signal-detail-row">
                <span className="signal-detail-label">Screen</span>
                <span className="signal-detail-value">{browser.screenResolution}</span>
              </div>
              <div className="signal-detail-row">
                <span className="signal-detail-label">Color Depth</span>
                <span className="signal-detail-value">{browser.colorDepth}-bit</span>
              </div>
              <div className="signal-detail-row">
                <span className="signal-detail-label">Language</span>
                <span className="signal-detail-value">{browser.language}</span>
              </div>
              <div className="signal-detail-row">
                <span className="signal-detail-label">Timezone</span>
                <span className="signal-detail-value">{browser.timezone}</span>
              </div>
              <div className="signal-detail-row">
                <span className="signal-detail-label">Cookies</span>
                <span className="signal-detail-value">
                  {browser.cookiesEnabled ? <><CheckCircle size={14} /> Enabled</> : <><XCircle size={14} /> Disabled</>}
                </span>
              </div>
              <div className="signal-detail-row">
                <span className="signal-detail-label">Do Not Track</span>
                <span className="signal-detail-value">
                  {browser.doNotTrack ? <><CheckCircle size={14} /> Enabled</> : <><XCircle size={14} /> Disabled</>}
                </span>
              </div>
              <div className="signal-detail-row">
                <span className="signal-detail-label">Mobile</span>
                <span className="signal-detail-value">
                  {browser.isMobile ? <><Smartphone size={14} /> Yes</> : <><Monitor size={14} /> No</>}
                </span>
              </div>
            </div>

            <div className="signal-useragent">
              <h4>User Agent</h4>
              <code>{browser.userAgent}</code>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="signal-footer">
        <span className="signal-timestamp">
          Last updated: {new Date(networkInfo.timestamp).toLocaleTimeString()}
        </span>
      </footer>
    </div>
  );
}

// ============================================
// HELPERS
// ============================================

function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

function getBrowserIcon(browser: string): ReactNode {
  switch (browser.toLowerCase()) {
    case 'chrome': return <Globe size={20} />;
    case 'firefox': return <Globe size={20} />;
    case 'safari': return <Compass size={20} />;
    case 'edge': return <Globe size={20} />;
    case 'opera': return <Globe size={20} />;
    default: return <Globe size={20} />;
  }
}
