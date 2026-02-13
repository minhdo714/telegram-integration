'use client';

import { useState } from 'react';
import { FiX, FiGlobe, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

export default function BulkProxyModal({ isOpen, onClose, selectedCount, onUpdate }) {
    const [proxyUrl, setProxyUrl] = useState('');

    const handleSubmit = () => {
        if (!proxyUrl.trim() && !confirm('No proxy entered. This will clear proxies for selected accounts. Continue?')) {
            return;
        }
        onUpdate(proxyUrl.trim());
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem' }}>
                        <FiGlobe /> Bulk Proxy Update
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255, 255, 255, 0.4)', cursor: 'pointer', fontSize: '1.25rem' }}><FiX /></button>
                </div>

                <div style={{ padding: '1.5rem' }}>
                    <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        Enter the proxy URL to apply to the <strong>{selectedCount}</strong> selected accounts.
                    </p>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem' }}>PROXY URL</label>
                        <input
                            type="text"
                            placeholder="http://user:pass@host:port"
                            value={proxyUrl}
                            onChange={(e) => setProxyUrl(e.target.value)}
                            style={{
                                width: '100%',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                padding: '0.8rem 1rem',
                                color: 'white',
                                fontSize: '1rem',
                                outline: 'none',
                            }}
                        />
                        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start', background: 'rgba(245, 87, 108, 0.05)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(245, 87, 108, 0.1)' }}>
                            <FiAlertCircle style={{ color: '#f5576c', marginTop: '2px', flexShrink: 0 }} />
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                                Formatting: <code>http://username:password@ip:port</code> or <code>socks5://ip:port</code>. Leave blank to remove existing proxies.
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={onClose}
                            style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontWeight: '600' }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            style={{
                                flex: 2,
                                padding: '0.8rem',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                border: 'none',
                                color: 'white',
                                cursor: 'pointer',
                                fontWeight: '600'
                            }}
                        >
                            Update {selectedCount} Proxies
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
