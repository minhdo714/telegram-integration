'use client';

import { useState, useEffect } from 'react';
import { FiX, FiFolder, FiTrash2, FiCheck, FiLoader } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

export default function LoadConfigPresetModal({ isOpen, onClose, userId, onLoad, onPresetLoaded }) {
    const [presets, setPresets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingPresetId, setLoadingPresetId] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchPresets();
        }
    }, [isOpen]);

    const fetchPresets = async () => {
        setLoading(true);
        console.log('DEBUG: Fetching presets...');
        try {
            const cookieValue = document.cookie.split('; ').find(row => row.startsWith('user_id='))?.split('=')[1];
            const userIdToUse = userId || cookieValue || '1';
            console.log('DEBUG: Using userId for fetch:', userIdToUse);

            const res = await fetch(`/api/ai-configs?userId=${userIdToUse}`);
            console.log('DEBUG: Fetch presets status:', res.status);

            const data = await res.json();
            console.log('DEBUG: Fetch presets data:', data);

            if (data.status === 'success') {
                setPresets(data.configs || []);
                console.log(`DEBUG: Loaded ${data.configs?.length || 0} presets`);
            } else {
                toast.error('Failed to load presets: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('DEBUG: Fetch presets error:', error);
            toast.error('Network error loading presets: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLoad = async (preset) => {
        setLoadingPresetId(preset.id);

        // We pass the preset data back to parent to fill the form
        onPresetLoaded(preset);

        // Simulate a small delay for UX
        await new Promise(r => setTimeout(r, 300));

        setLoadingPresetId(null);
        toast.success(`Loaded "${preset.name}"`);
        onClose();
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!confirm('Delete this preset permanently?')) return;

        try {
            const userIdFromCookie = document.cookie.split('; ').find(row => row.startsWith('user_id='))?.split('=')[1] || '1';
            const res = await fetch(`/api/ai-configs/${id}?userId=${userId || userIdFromCookie}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.status === 'success') {
                toast.success('Preset deleted');
                setPresets(prev => prev.filter(p => p.id !== id));
            } else {
                toast.error(data.error || 'Delete failed');
            }
        } catch (error) {
            toast.error('Network error');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <FiFolder /> Load AI Preset
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255, 255, 255, 0.4)', cursor: 'pointer' }}><FiX /></button>
                </div>

                <div style={{ padding: '10px', overflowY: 'auto', flex: 1 }}>
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>
                            <FiLoader className="spin" style={{ fontSize: '24px', marginBottom: '10px' }} />
                            <div>Loading saved presets...</div>
                        </div>
                    ) : presets.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>
                            <div style={{ fontSize: '24px', marginBottom: '10px' }}>📂</div>
                            <div>No saved presets yet.<br />Save your current configuration to see it here.</div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {presets.map(preset => (
                                <div
                                    key={preset.id}
                                    onClick={() => handleLoad(preset)}
                                    style={{
                                        padding: '16px',
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                >
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '15px', color: 'white' }}>{preset.name}</div>
                                        <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                                            {new Date(preset.created_at + 'Z').toLocaleDateString()} • {JSON.parse(preset.opener_images || '[]').length} photos
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        {loadingPresetId === preset.id ? (
                                            <FiLoader className="spin" />
                                        ) : (
                                            <button
                                                className="btn-text"
                                                style={{ fontSize: '12px', color: '#6366f1' }}
                                            >
                                                LOAD
                                            </button>
                                        )}

                                        <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />

                                        <button
                                            onClick={(e) => handleDelete(e, preset.id)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#ef4444',
                                                opacity: 0.5,
                                                cursor: 'pointer',
                                                padding: '4px'
                                            }}
                                            title="Delete Preset"
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
