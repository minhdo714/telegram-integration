'use client';

import { useState } from 'react';
import { FiX, FiSave, FiTag } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

export default function SaveConfigPresetModal({ isOpen, onClose, currentAssets, outreachMessage, exampleChatflow, blastList, onSave }) {
    const [name, setName] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error('Please enter a name for the preset');
            return;
        }

        setSaving(true);
        console.log('DEBUG: Attempting to save preset:', name);
        try {
            const cookieValue = document.cookie.split('; ').find(row => row.startsWith('user_id='))?.split('=')[1];
            const userId = cookieValue || '1';
            console.log('DEBUG: Using userId for save:', userId);

            const payload = {
                user_id: parseInt(userId),
                name: name.trim(),
                system_prompt: "You are a flirty, fun, and engaging OF model. Keep messages short, lowercase, and casual.",
                model_provider: "openrouter",
                model_name: "anthropic/claude-3-haiku",
                temperature: 0.7,
                opener_images: JSON.stringify(currentAssets.openers.map(p => p.replace('/api/uploads/', ''))),
                model_face_ref: currentAssets.faceRef?.replace('/api/uploads/', ''),
                room_bg_ref: currentAssets.roomRef?.replace('/api/uploads/', ''),
                outreach_message: outreachMessage,
                example_chatflow: exampleChatflow,
                blast_list: blastList
            };
            console.log('DEBUG: Save payload:', payload);

            const res = await fetch('/api/ai-configs/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            console.log('DEBUG: Save response status:', res.status);
            const data = await res.json();
            console.log('DEBUG: Save response data:', data);

            if (data.status === 'success') {
                toast.success('Preset saved successfully!');
                onSave();
                onClose();
            } else {
                toast.error(data.error || 'Failed to save preset');
                console.error('Save failed:', data.error);
            }
        } catch (error) {
            console.error('DEBUG: Save Error:', error);
            toast.error('Network error during save: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <FiSave /> Save as Config AI Preset
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255, 255, 255, 0.4)', cursor: 'pointer' }}><FiX /></button>
                </div>

                <div style={{ padding: '1.5rem' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem' }}>PRESET NAME</label>
                        <div style={{ position: 'relative' }}>
                            <FiTag style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                            <input
                                type="text"
                                placeholder="e.g. Latina Baddie 2.0"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                style={{
                                    width: '100%',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    padding: '0.8rem 1rem 0.8rem 2.5rem',
                                    color: 'white',
                                    fontSize: '1rem',
                                    outline: 'none',
                                }}
                                autoFocus
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={onClose}
                            style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer' }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            style={{
                                flex: 2,
                                padding: '0.8rem',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                border: 'none',
                                color: 'white',
                                cursor: saving ? 'wait' : 'pointer',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            {saving ? 'Saving...' : <><FiSave /> Save Preset</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
