'use client';

import { useState, useEffect } from 'react';
import { FiX, FiSave, FiExternalLink } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

export default function AccountDetailDrawer({ account, onClose, onSaved }) {
    const [proxyUrl, setProxyUrl] = useState('');
    const [sessionJson, setSessionJson] = useState('');
    const [aiConfigs, setAiConfigs] = useState([]);
    const [selectedConfigId, setSelectedConfigId] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!account) return;
        setProxyUrl(account.proxyUrl || '');
        setSessionJson('');
        setSelectedConfigId(account.activeConfigId || '');
        fetchAiConfigs();
    }, [account]);

    const fetchAiConfigs = async () => {
        try {
            const res = await fetch('/api/config/presets?userId=1');
            const data = await res.json();
            if (data.status === 'success') setAiConfigs(data.presets || []);
        } catch (e) { /* ignore */ }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const updates = {};
            if (proxyUrl !== (account.proxyUrl || '')) updates.proxyUrl = proxyUrl;
            if (selectedConfigId !== (account.activeConfigId || '')) updates.activeConfigId = selectedConfigId || null;

            if (Object.keys(updates).length > 0) {
                const res = await fetch(`/api/accounts/${account.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: 1, ...updates })
                });
                if (!res.ok) throw new Error('Failed to save account settings');
            }

            // Handle session JSON separately
            if (sessionJson.trim()) {
                let parsed;
                try { parsed = JSON.parse(sessionJson); } catch {
                    toast.error('Invalid session JSON — check your format');
                    setSaving(false);
                    return;
                }
                const res = await fetch('/api/accounts/import-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ accountId: account.id, sessionData: parsed, userId: 1 })
                });
                if (!res.ok) {
                    const d = await res.json();
                    throw new Error(d.error || 'Session import failed');
                }
            }

            toast.success('Account settings saved');
            onSaved?.();
            onClose();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (!account) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    zIndex: 1000,
                    backdropFilter: 'blur(2px)'
                }}
            />

            {/* Drawer */}
            <div style={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                width: '420px',
                background: '#0f0f1e',
                borderLeft: '1px solid rgba(255,255,255,0.1)',
                zIndex: 1001,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '-20px 0 60px rgba(0,0,0,0.5)'
            }}>
                {/* Header */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontWeight: '700', fontSize: '1.1rem', color: 'white' }}>
                            {account.firstName} {account.lastName}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>@{account.telegramUsername} · ID {account.id}</div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '1.2rem' }}>
                        <FiX />
                    </button>
                </div>

                {/* Body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Proxy Settings */}
                    <section>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                            🛡️ Proxy URL
                        </label>
                        <input
                            type="text"
                            value={proxyUrl}
                            onChange={e => setProxyUrl(e.target.value)}
                            placeholder="socks5://user:pass@host:port  or  http://host:port"
                            style={{
                                width: '100%', boxSizing: 'border-box',
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                padding: '0.7rem 1rem',
                                color: 'white',
                                fontSize: '0.85rem',
                                outline: 'none',
                                fontFamily: 'monospace'
                            }}
                        />
                        <p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
                            Supports HTTP, HTTPS, SOCKS4, SOCKS5. Leave blank for no proxy.
                        </p>
                    </section>

                    {/* AI Config */}
                    <section>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                            🤖 AI Configuration Preset
                        </label>
                        <select
                            value={selectedConfigId}
                            onChange={e => setSelectedConfigId(e.target.value)}
                            style={{
                                width: '100%',
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                padding: '0.7rem 1rem',
                                color: 'white',
                                fontSize: '0.85rem',
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="">— Use Default (no preset) —</option>
                            {aiConfigs.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <a
                            href="/config"
                            target="_blank"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '0.35rem', fontSize: '0.75rem', color: '#6366f1', textDecoration: 'none' }}
                        >
                            Manage presets <FiExternalLink />
                        </a>
                    </section>

                    {/* Session JSON */}
                    <section>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                            📋 Session JSON (optional — to import/update session)
                        </label>
                        <textarea
                            value={sessionJson}
                            onChange={e => setSessionJson(e.target.value)}
                            placeholder={'{\n  "session_string": "1BVtsOKE...",\n  "api_id": 12345,\n  "api_hash": "abc123..."\n}'}
                            rows={8}
                            style={{
                                width: '100%', boxSizing: 'border-box',
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                padding: '0.7rem 1rem',
                                color: 'white',
                                fontSize: '0.78rem',
                                outline: 'none',
                                fontFamily: 'monospace',
                                resize: 'vertical'
                            }}
                        />
                        <p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
                            Paste JSON with <code style={{ color: '#4facfe' }}>session_string</code>, <code style={{ color: '#4facfe' }}>api_id</code>, and <code style={{ color: '#4facfe' }}>api_hash</code>. Leave blank to keep the current session.
                        </p>
                    </section>

                    {/* Account Info */}
                    <section style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'rgba(255,255,255,0.4)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Account Info</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.82rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'rgba(255,255,255,0.4)' }}>Phone</span>
                                <span style={{ color: 'white', fontFamily: 'monospace' }}>{account.phoneNumber || '—'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'rgba(255,255,255,0.4)' }}>Status</span>
                                <span style={{ color: account.sessionStatus === 'active' ? '#00f2fe' : '#f5576c' }}>{account.sessionStatus}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'rgba(255,255,255,0.4)' }}>Daily DMs</span>
                                <span style={{ color: 'white' }}>{account.dailyDmSentToday || 0} / {account.dailyDmQuota || '—'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'rgba(255,255,255,0.4)' }}>Messages</span>
                                <a href={`/messages?accountId=${account.id}`} style={{ color: '#4facfe', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    Open inbox <FiExternalLink style={{ fontSize: '0.7rem' }} />
                                </a>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '0.75rem' }}>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        style={{
                            flex: 1,
                            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.75rem',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            opacity: saving ? 0.7 : 1
                        }}
                    >
                        <FiSave /> {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            color: 'rgba(255,255,255,0.7)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            padding: '0.75rem 1.25rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </>
    );
}
