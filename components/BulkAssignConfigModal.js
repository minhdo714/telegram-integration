'use client';

import { useState, useEffect } from 'react';
import { FiX, FiCheck, FiSettings, FiPlus } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

export default function BulkAssignConfigModal({ isOpen, onClose, selectedCount, onAssign }) {
    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedConfigId, setSelectedConfigId] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchConfigs();
        }
    }, [isOpen]);

    const fetchConfigs = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/ai-configs?userId=1');
            const data = await res.json();
            if (data.status === 'success') {
                setConfigs(data.configs);
            }
        } catch (error) {
            toast.error('Failed to load AI configs');
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = () => {
        if (!selectedConfigId) {
            toast.error('Please select a configuration');
            return;
        }
        onAssign(selectedConfigId);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem' }}>
                        <FiSettings /> Assign AI Config
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255, 255, 255, 0.4)', cursor: 'pointer', fontSize: '1.25rem' }}><FiX /></button>
                </div>

                <div style={{ padding: '1.5rem' }}>
                    <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        Select which AI identity to apply to the <strong>{selectedCount}</strong> selected accounts.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto', marginBottom: '1.5rem' }}>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '1rem', color: 'rgba(255,255,255,0.3)' }}>Loading configs...</div>
                        ) : configs.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '1rem' }}>
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>No saved configurations found.</p>
                                <button
                                    onClick={() => window.location.href = '/config'}
                                    style={{ color: '#00f2fe', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' }}
                                >
                                    Create one now
                                </button>
                            </div>
                        ) : configs.map(config => (
                            <div
                                key={config.id}
                                onClick={() => setSelectedConfigId(config.id)}
                                style={{
                                    padding: '1rem',
                                    borderRadius: '10px',
                                    background: selectedConfigId === config.id ? 'rgba(0, 242, 254, 0.05)' : 'rgba(255, 255, 255, 0.03)',
                                    border: selectedConfigId === config.id ? '1px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.05)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: '600', color: selectedConfigId === config.id ? '#00f2fe' : 'white' }}>{config.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)' }}>{config.model_name} / {config.model_provider}</div>
                                </div>
                                {selectedConfigId === config.id && <FiCheck color="#00f2fe" />}
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={onClose}
                            style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontWeight: '600' }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAssign}
                            disabled={!selectedConfigId}
                            style={{
                                flex: 1,
                                padding: '0.8rem',
                                borderRadius: '8px',
                                background: selectedConfigId ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' : 'rgba(255,255,255,0.05)',
                                border: 'none',
                                color: selectedConfigId ? 'white' : 'rgba(255,255,255,0.2)',
                                cursor: selectedConfigId ? 'pointer' : 'not-allowed',
                                fontWeight: '600'
                            }}
                        >
                            Apply to {selectedCount} Accounts
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
