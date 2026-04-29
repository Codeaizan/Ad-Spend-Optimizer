'use client';

import { useState } from 'react';

interface Endpoint {
  id: string;
  label: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  body?: string;
}

const ENDPOINTS: Endpoint[] = [
  { id: '1', label: 'Account Overview', method: 'GET', path: '/api/overview' },
  { id: '2', label: 'All Campaigns', method: 'GET', path: '/api/campaigns' },
  { id: '3', label: 'Facebook Overview', method: 'GET', path: '/api/facebook-overview' },
  { id: '4', label: 'Alerts Check', method: 'POST', path: '/api/alerts/check', body: '{}' },
  { id: '5', label: 'Metrics (c_1, 7d)', method: 'GET', path: '/api/metrics?campaignId=c_1&dateRange=7' },
  { id: '6', label: 'All Keywords', method: 'GET', path: '/api/keywords' },
];

interface TestResult {
  status: number;
  ok: boolean;
  data: any;
  duration: number;
}

export default function ApiTestPage() {
  const [results, setResults] = useState<Record<string, TestResult | null>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const runTest = async (ep: Endpoint) => {
    setLoading(prev => ({ ...prev, [ep.id]: true }));
    setResults(prev => ({ ...prev, [ep.id]: null }));

    const start = performance.now();

    try {
      const res = await fetch(ep.path, {
        method: ep.method,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'adskey_faizan_2026',
        },
        ...(ep.body ? { body: ep.body } : {}),
      });

      const data = await res.json();
      const duration = Math.round(performance.now() - start);

      setResults(prev => ({
        ...prev,
        [ep.id]: { status: res.status, ok: res.ok, data, duration },
      }));
    } catch (err: any) {
      const duration = Math.round(performance.now() - start);
      setResults(prev => ({
        ...prev,
        [ep.id]: { status: 0, ok: false, data: { error: err.message }, duration },
      }));
    } finally {
      setLoading(prev => ({ ...prev, [ep.id]: false }));
    }
  };

  const runAll = async () => {
    for (const ep of ENDPOINTS) {
      await runTest(ep);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0b',
      color: '#e4e4e7',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '2rem',
    }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #27272a',
        }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
              🧪 API Endpoint Tester
            </h1>
            <p style={{ color: '#71717a', fontSize: '0.875rem', margin: '4px 0 0' }}>
              Development tool — verify all endpoints before connecting n8n
            </p>
          </div>
          <button
            onClick={runAll}
            style={{
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseOver={e => (e.currentTarget.style.background = '#2563eb')}
            onMouseOut={e => (e.currentTarget.style.background = '#3b82f6')}
          >
            ▶ Run All Tests
          </button>
        </div>

        {/* Endpoint Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {ENDPOINTS.map(ep => {
            const result = results[ep.id];
            const isLoading = loading[ep.id];

            return (
              <div
                key={ep.id}
                style={{
                  background: '#18181b',
                  border: '1px solid #27272a',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  transition: 'border-color 0.2s',
                }}
              >
                {/* Top row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <span style={{
                      background: ep.method === 'GET' ? '#10b98120' : ep.method === 'POST' ? '#3b82f620' : '#f59e0b20',
                      color: ep.method === 'GET' ? '#10b981' : ep.method === 'POST' ? '#3b82f6' : '#f59e0b',
                      padding: '2px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      letterSpacing: '0.05em',
                    }}>
                      {ep.method}
                    </span>
                    <code style={{
                      color: '#a1a1aa',
                      fontSize: '0.875rem',
                      fontFamily: 'monospace',
                    }}>
                      {ep.path}
                    </code>
                    <span style={{ color: '#52525b', fontSize: '0.8rem' }}>— {ep.label}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {result && (
                      <span style={{
                        fontSize: '0.8rem',
                        color: result.ok ? '#10b981' : '#ef4444',
                        fontWeight: 600,
                      }}>
                        {result.ok ? '✅' : '❌'} {result.status} · {result.duration}ms
                      </span>
                    )}
                    <button
                      onClick={() => runTest(ep)}
                      disabled={isLoading}
                      style={{
                        background: '#27272a',
                        color: '#e4e4e7',
                        border: '1px solid #3f3f46',
                        borderRadius: '6px',
                        padding: '6px 16px',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        cursor: isLoading ? 'wait' : 'pointer',
                        opacity: isLoading ? 0.5 : 1,
                        transition: 'background 0.2s',
                      }}
                      onMouseOver={e => !isLoading && (e.currentTarget.style.background = '#3f3f46')}
                      onMouseOut={e => (e.currentTarget.style.background = '#27272a')}
                    >
                      {isLoading ? '⏳' : 'Test'}
                    </button>
                  </div>
                </div>

                {/* Response block */}
                {result && (
                  <pre style={{
                    marginTop: '12px',
                    padding: '12px 16px',
                    background: '#09090b',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    color: '#a1a1aa',
                    overflow: 'auto',
                    maxHeight: '240px',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}>
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '2rem',
          padding: '12px 16px',
          background: '#3b82f610',
          border: '1px solid #3b82f630',
          borderRadius: '8px',
          fontSize: '0.8rem',
          color: '#60a5fa',
          textAlign: 'center',
        }}>
          💡 All requests use header <code style={{ fontFamily: 'monospace' }}>x-api-key: adskey_faizan_2026</code> — same key needed in n8n HTTP Request nodes
        </div>
      </div>
    </div>
  );
}
