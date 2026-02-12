
'use client';

import { useState, useEffect } from 'react';
import styles from './AIConfigModal.module.css';

export default function AIConfigModal({ isOpen, onClose, accountId, onAssign }) {
    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedConfigId, setSelectedConfigId] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        systemPrompt: '',
        modelProvider: 'anthropic',
        modelName: 'claude-3-5-sonnet-20240620',
        temperature: 0.7
    });

    useEffect(() => {
        if (isOpen) {
            fetchConfigs();
        }
    }, [isOpen]);

    const fetchConfigs = async () => {
        try {
            setLoading(true);
            const userId = document.cookie.split('; ').find(row => row.startsWith('user_id='))?.split('=')[1] || '1';
            const response = await fetch(`/api/ai-configs?userId=${userId}`);
            const data = await response.json();
            if (data.configs) {
                setConfigs(data.configs);
            }
        } catch (error) {
            console.error("Failed to load configs", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const userId = document.cookie.split('; ').find(row => row.startsWith('user_id='))?.split('=')[1] || '1';
            const response = await fetch('/api/ai-configs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, userId })
            });
            if (response.ok) {
                setIsEditing(false);
                fetchConfigs();
                setFormData({
                    name: '',
                    systemPrompt: '',
                    modelProvider: 'anthropic',
                    modelName: 'claude-3-5-sonnet-20240620',
                    temperature: 0.7
                });
            } else {
                alert("Failed to save config");
            }
        } catch (error) {
            console.error("Error saving config", error);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this preset?")) return;
        try {
            const userId = document.cookie.split('; ').find(row => row.startsWith('user_id='))?.split('=')[1] || '1';
            await fetch(`/api/ai-configs/${id}?userId=${userId}`, { method: 'DELETE' });
            fetchConfigs();
            if (selectedConfigId === id) setSelectedConfigId(null);
        } catch (error) {
            console.error("Error deleting config", error);
        }
    };

    const handleAssign = async () => {
        if (!selectedConfigId) return;
        try {
            await fetch(`/api/accounts/${accountId}/assign-config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activeConfigId: selectedConfigId })
            });
            onAssign();
            onClose();
        } catch (error) {
            console.error("Error assigning config", error);
            alert("Failed to assign config");
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>🤖 AI Configuration</h2>
                    <button onClick={onClose} className={styles.closeBtn}>&times;</button>
                </div>

                <div className={styles.content}>
                    {isEditing ? (
                        <div className={styles.form}>
                            <h3>{formData.id ? 'Edit Preset' : 'New Preset'}</h3>
                            <input
                                type="text"
                                placeholder="Preset Name (e.g. Sassy Gf)"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className={styles.input}
                            />
                            <textarea
                                placeholder="System Prompt..."
                                value={formData.systemPrompt}
                                onChange={e => setFormData({ ...formData, systemPrompt: e.target.value })}
                                className={styles.textarea}
                                rows={6}
                            />
                            <div className={styles.row}>
                                <select
                                    value={formData.modelProvider}
                                    onChange={e => setFormData({ ...formData, modelProvider: e.target.value })}
                                    className={styles.select}
                                >
                                    <option value="anthropic">Anthropic</option>
                                    <option value="openai">OpenAI</option>
                                    <option value="gemini">Google Gemini</option>
                                </select>
                                <input
                                    type="text"
                                    placeholder="Model Name"
                                    value={formData.modelName}
                                    onChange={e => setFormData({ ...formData, modelName: e.target.value })}
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.actions}>
                                <button onClick={() => setIsEditing(false)} className="btn btn-secondary">Cancel</button>
                                <button onClick={handleSave} className="btn btn-primary">Save Preset</button>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.list}>
                            <div className={styles.listHeader}>
                                <h3>Select a Preset</h3>
                                <button onClick={() => {
                                    setFormData({
                                        name: '',
                                        systemPrompt: '',
                                        modelProvider: 'anthropic',
                                        modelName: 'claude-3-5-sonnet-20240620',
                                        temperature: 0.7
                                    });
                                    setIsEditing(true);
                                }} className="btn btn-sm btn-secondary">+ New</button>
                            </div>

                            {loading ? <p>Loading...</p> : (
                                <div className={styles.grid}>
                                    {configs.map(config => (
                                        <div
                                            key={config.id}
                                            className={`${styles.card} ${selectedConfigId === config.id ? styles.selected : ''}`}
                                            onClick={() => setSelectedConfigId(config.id)}
                                        >
                                            <div className={styles.cardHeader}>
                                                <strong>{config.name}</strong>
                                                <button onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(config.id);
                                                }} className={styles.deleteBtn}>🗑️</button>
                                            </div>
                                            <p className={styles.preview}>{config.system_prompt.substring(0, 60)}...</p>
                                            <div className={styles.tags}>
                                                <span className={styles.tag}>{config.model_provider}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {configs.length === 0 && <p>No presets found. Create one!</p>}
                                </div>
                            )}

                            <div className={styles.footerActions}>
                                <button onClick={handleAssign} disabled={!selectedConfigId} className="btn btn-primary full-width">
                                    Assign to Account
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
