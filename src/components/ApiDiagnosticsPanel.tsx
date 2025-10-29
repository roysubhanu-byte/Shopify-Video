import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, RefreshCw, X } from 'lucide-react';
import { API_URL } from '../lib/config';

interface DiagnosticCheck {
  name: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
  details?: any;
}

interface DiagnosticsResponse {
  status: 'healthy' | 'warning' | 'error';
  timestamp: string;
  duration: string;
  uptime: number;
  checks: DiagnosticCheck[];
  summary: {
    total: number;
    ok: number;
    warnings: number;
    errors: number;
  };
  recommendations: string[];
}

export function ApiDiagnosticsPanel() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const fetchDiagnostics = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/diagnostics`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setDiagnostics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch diagnostics');
      console.error('Diagnostics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDiagnostics();
    }
  }, [isOpen]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
      case 'healthy':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'error':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium z-50"
      >
        <AlertCircle className="w-4 h-4" />
        API Diagnostics
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-[80vh] bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden z-50">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">API Diagnostics</h3>
          {diagnostics && getStatusIcon(diagnostics.status)}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDiagnostics}
            disabled={loading}
            className="p-1 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
            title="Refresh diagnostics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto max-h-[calc(80vh-60px)]">
        {loading && !diagnostics && (
          <div className="p-8 text-center text-gray-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p>Running diagnostics...</p>
          </div>
        )}

        {error && (
          <div className="p-4 m-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Diagnostics Failed</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <p className="text-xs text-red-600 mt-2">
                  Cannot reach API at: <code className="bg-red-100 px-1 py-0.5 rounded">{API_URL}</code>
                </p>
              </div>
            </div>
          </div>
        )}

        {diagnostics && (
          <div className="p-4 space-y-4">
            <div className={`p-3 rounded-lg border ${getStatusColor(diagnostics.status)}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Overall Status</span>
                <span className="text-sm capitalize">{diagnostics.status}</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs mt-2">
                <div className="text-center">
                  <div className="font-semibold text-green-600">{diagnostics.summary.ok}</div>
                  <div className="text-gray-600">OK</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-yellow-600">{diagnostics.summary.warnings}</div>
                  <div className="text-gray-600">Warnings</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-red-600">{diagnostics.summary.errors}</div>
                  <div className="text-gray-600">Errors</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-700">{diagnostics.uptime}s</div>
                  <div className="text-gray-600">Uptime</div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">System Checks</h4>
              <div className="space-y-2">
                {diagnostics.checks.map((check, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded border ${getStatusColor(check.status)}`}
                  >
                    <div className="flex items-start gap-2">
                      {getStatusIcon(check.status)}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{check.name}</div>
                        <div className="text-xs mt-1 opacity-80">{check.message}</div>
                        {check.details && (
                          <details className="mt-2">
                            <summary className="text-xs cursor-pointer hover:underline">
                              View Details
                            </summary>
                            <pre className="text-xs mt-1 p-2 bg-black/5 rounded overflow-x-auto">
                              {JSON.stringify(check.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {diagnostics.recommendations.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Recommendations</h4>
                <ul className="space-y-1">
                  {diagnostics.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
              <div className="flex justify-between">
                <span>Response Time:</span>
                <span className="font-mono">{diagnostics.duration}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Last Check:</span>
                <span className="font-mono">
                  {new Date(diagnostics.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span>API URL:</span>
                <span className="font-mono text-xs truncate">{API_URL}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
