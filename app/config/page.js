'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import styles from '@/components/MessageComposer.module.css'; // Global container styles
import assetStyles from './AIConfig.module.css'; // New asset specific styles

export default function AIConfig() {
    const searchParams = useSearchParams();
    const [accounts, setAccounts] = useState([]);
    const [selectedAccountId, setSelectedAccountId] = useState(searchParams.get('accountId') || '');
    const [botStatus, setBotStatus] = useState('stopped');
    const [pid, setPid] = useState(null);
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState([]);

    // Asset States
    const [faceRef, setFaceRef] = useState(null);
    const [roomRef, setRoomRef] = useState(null);
    const [openers, setOpeners] = useState([]);

    // Outreach State
    const [usernames, setUsernames] = useState('');
    const [outreachMessage, setOutreachMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        fetchAccounts();
        checkStatus();
        const interval = setInterval(checkStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (selectedAccountId) {
            fetchAssets(selectedAccountId);
        } else {
            // Reset assets if no account
            setFaceRef(null);
            setRoomRef(null);
            setOpeners([]);
        }
    }, [selectedAccountId]);

    const fetchAccounts = async () => {
        try {
            // Using userId=1 for MVP simplicity
            const res = await fetch('/api/accounts?userId=1');
            const data = await res.json();
            if (data.accounts) {
                setAccounts(data.accounts);

                // If ID is in URL, ensure it's selected. 
                if (!selectedAccountId) {
                    const active = data.accounts.find(a => a.status === 'active');
                    if (active) setSelectedAccountId(active.id);
                }
            }
        } catch (error) {
            console.error('Failed to fetch accounts', error);
        }
    };

    const checkStatus = async () => {
        try {
            const res = await fetch('/api/bot/status');
            const data = await res.json();
            setBotStatus(data.status || 'stopped');
            setPid(data.pid);
        } catch (error) {
            console.error('Failed to check status:', error);
            setBotStatus('stopped'); // Default to stopped on error
        }
    };

    const fetchAssets = async (accountId) => {
        try {
            const res = await fetch(`/api/assets/config?accountId=${accountId}`);
            const data = await res.json();

            if (data.status === 'success' && data.assets) {
                const getProxyUrl = (relativePath) => relativePath ? `/api/uploads/${relativePath}` : null;

                setFaceRef(getProxyUrl(data.assets.model_face_ref));
                setRoomRef(getProxyUrl(data.assets.room_bg_ref));

                if (data.assets.opener_images) {
                    try {
                        const parsed = JSON.parse(data.assets.opener_images);
                        setOpeners(parsed.map(p => getProxyUrl(p)));
                    } catch (e) {
                        setOpeners([]);
                    }
                } else {
                    setOpeners([]);
                }
            } else {
                setFaceRef(null);
                setRoomRef(null);
                setOpeners([]);
            }
        } catch (error) {
            console.error('Failed to fetch assets:', error);
        }
    };

    const handleUpload = async (type, file) => {
        if (!selectedAccountId) {
            alert('Please select an account first!');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('accountId', selectedAccountId);
        formData.append('type', type);

        try {
            const res = await fetch('/api/assets/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (data.status === 'success') {
                const proxyUrl = `/api/uploads/${data.path}`;

                if (type === 'face') setFaceRef(proxyUrl);
                if (type === 'room') setRoomRef(proxyUrl);
                if (type === 'opener') setOpeners(prev => [...prev, proxyUrl]);

                addLog(`✅ Uploaded ${type}: ${file.name}`);
            } else {
                addLog(`❌ Upload failed: ${data.message || data.error}`);
            }
        } catch (error) {
            addLog(`❌ Upload Error: ${error.message}`);
        }
    };

    const deleteAsset = async (type, filename, assetPath) => {
        if (!selectedAccountId) return;

        if (!confirm('Are you sure you want to delete this asset? This cannot be undone.')) {
            return;
        }

        try {
            const cleanPath = assetPath.replace('/api/uploads/', '');

            const res = await fetch('/api/assets/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    account_id: selectedAccountId,
                    type,
                    filename: cleanPath
                })
            });

            if (res.ok) {
                if (type === 'face') setFaceRef(null);
                if (type === 'room') setRoomRef(null);
                if (type === 'opener') {
                    setOpeners(prev => prev.filter(p => p !== assetPath));
                }
            } else {
                const err = await res.json();
                alert('Failed to delete: ' + err.error);
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Error deleting asset');
        }
    };

    // Outreach Logic
    const handleStartOutreach = async () => {
        if (!selectedAccountId) return alert('Please select an account');
        if (!usernames.trim()) return alert('Please enter at least one username');

        const userList = usernames.split(/[\n,]+/).map(u => u.trim()).filter(u => u);
        if (userList.length === 0) return alert('No valid usernames found');

        setIsSending(true);
        addLog(`[Outreach] Starting to ${userList.length} users...`);

        for (const user of userList) {
            const recipient = user.replace('@', '');
            addLog(`[Outreach] Sending to @${recipient}...`);

            try {
                const msgToSend = outreachMessage || "Hey! Saw you on my feed...";

                const res = await fetch('/api/bot/send-message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        accountId: selectedAccountId,
                        recipient: recipient,
                        message: msgToSend
                    })
                });

                const data = await res.json();

                if (res.ok) {
                    addLog(`[Outreach] ✅ Sent to @${recipient}`);
                } else {
                    addLog(`[Outreach] ❌ Failed @${recipient}: ${data.error || 'Unknown error'}`);
                }
            } catch (err) {
                addLog(`[Outreach] ❌ Error @${recipient}: ${err.message}`);
            }
            // 2s delay
            await new Promise(r => setTimeout(r, 2000));
        }

        setIsSending(false);
        addLog('[Outreach] Batch complete.');
    };

    const toggleBot = async () => {
        setLoading(true);
        const action = botStatus === 'running' ? 'stop' : 'start';

        try {
            const res = await fetch(`/api/bot/${action}`, { method: 'POST' });
            const data = await res.json();

            if (data.status === 'started') {
                setBotStatus('running');
                setPid(data.pid);
                addLog('✅ Bot started successfully');
            } else if (data.status === 'stopped') {
                setBotStatus('stopped');
                setPid(null);
                addLog('🛑 Bot stopped');
            } else if (data.status === 'error') {
                addLog(`❌ Error: ${data.message}`);
            }
        } catch (error) {
            addLog(`❌ Network Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const addLog = (msg) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
    };

    const TrashIcon = () => (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="white" stroke="white" strokeWidth="1">
            <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );

    return (
        <>
            <Navigation />
            <div className="page" style={{ paddingTop: '80px', paddingBottom: '40px' }}>
                <div className="container">
                    <h1 className="title">AI Chatbot Configuration</h1>
                    <p className="subtitle">Manage per-account assets and selling personality</p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '40px' }}>

                        {/* LEFT COLUMN: Controls & Status */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div className={styles.modal} style={{ margin: 0, width: '100%', maxWidth: 'none', background: 'rgba(255,255,255,0.03)' }}>
                                <div className={styles.header}>
                                    <h2>Bot Control</h2>
                                    <div style={{
                                        padding: '6px 12px',
                                        borderRadius: '20px',
                                        background: botStatus === 'running' ? 'rgba(46, 213, 115, 0.2)' : 'rgba(255, 71, 87, 0.2)',
                                        color: botStatus === 'running' ? '#2ed573' : '#ff4757',
                                        fontWeight: 'bold',
                                        fontSize: '14px'
                                    }}>
                                        {(botStatus || 'stopped').toUpperCase()}
                                    </div>
                                </div>
                                <div className={styles.form}>
                                    <button
                                        onClick={toggleBot}
                                        disabled={loading}
                                        className="btn"
                                        style={{
                                            width: '100%',
                                            background: botStatus === 'running' ? '#ff4757' : '#2ed573',
                                            color: '#fff',
                                            border: 'none',
                                            padding: '16px',
                                            fontSize: '18px',
                                            fontWeight: 'bold',
                                            cursor: loading ? 'wait' : 'pointer',
                                            opacity: loading ? 0.7 : 1
                                        }}
                                    >
                                        {loading ? 'Processing...' : (botStatus === 'running' ? 'STOP AGENT' : 'START AGENT')}
                                    </button>
                                    <div style={{ marginTop: '20px', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', height: '200px', overflowY: 'auto' }}>
                                        <h4 style={{ margin: '0 0 10px 0', color: '#888', fontSize: '12px' }}>SYSTEM LOGS</h4>
                                        {logs.map((log, i) => (
                                            <div key={i} style={{ fontSize: '13px', fontFamily: 'monospace', color: '#ddd', marginBottom: '4px' }}>
                                                {log}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Manual Outreach Section (Moved from separate page) */}
                            <div className={styles.modal} style={{ margin: 0, width: '100%', maxWidth: 'none', background: 'rgba(255,255,255,0.03)' }}>
                                <div className={styles.header}>
                                    <h2>Manual Outreach</h2>
                                </div>
                                <div className={styles.form}>
                                    <div className={styles.field}>
                                        <label>Your sample chats (Optional)</label>
                                        <textarea
                                            value={outreachMessage}
                                            onChange={e => setOutreachMessage(e.target.value)}
                                            placeholder="Paste all sample chats here... The AI will adopt this vibe."
                                            style={{ width: '100%', height: '60px', padding: '10px', borderRadius: '8px', background: '#333', color: 'white', border: '1px solid #555' }}
                                        />
                                        <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>
                                            * This text is sent as the first message.
                                        </div>
                                    </div>

                                    <div className={styles.field}>
                                        <label>Target Usernames (One per line)</label>
                                        <textarea
                                            value={usernames}
                                            onChange={e => setUsernames(e.target.value)}
                                            placeholder="@user1&#10;@user2&#10;user3"
                                            style={{ width: '100%', height: '100px', padding: '10px', borderRadius: '8px', background: '#333', color: 'white', border: '1px solid #555' }}
                                        />
                                    </div>

                                    <button
                                        onClick={handleStartOutreach}
                                        disabled={isSending || !selectedAccountId}
                                        className="btn btn-primary"
                                        style={{ width: '100%', marginTop: '10px', opacity: isSending ? 0.7 : 1, background: '#6366f1' }}
                                    >
                                        {isSending ? 'Sending...' : 'Start Blast 🚀'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Account & Assets */}
                        <div className={styles.modal} style={{ margin: 0, width: '100%', maxWidth: 'none', background: 'rgba(255,255,255,0.03)' }}>
                            <div className={styles.header}>
                                <h2>Bot Identity & Assets</h2>
                            </div>
                            <div className={styles.form}>

                                {/* Account Selector */}
                                <div className={styles.field}>
                                    <label>Select Account to Configure</label>
                                    <select
                                        className={assetStyles.accountSelector}
                                        value={selectedAccountId}
                                        onChange={(e) => setSelectedAccountId(e.target.value)}
                                    >
                                        <option value="">-- Choose Account --</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.firstName || acc.telegramUsername || acc.phoneNumber} (ID: {acc.id})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Face Reference */}
                                <div className={styles.field}>
                                    <label>Model Face Reference (Mandatory)</label>
                                    <div className={assetStyles.uploadZone} style={{ position: 'relative' }}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            id="face-upload"
                                            onChange={(e) => e.target.files[0] && handleUpload('face', e.target.files[0])}
                                        />
                                        {faceRef ? (
                                            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                                <img src={faceRef} className={assetStyles.previewImage} alt="Face Ref" />
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        deleteAsset('face', null, faceRef);
                                                    }}
                                                    style={{
                                                        position: 'absolute',
                                                        top: '10px',
                                                        right: '10px',
                                                        background: 'rgba(0,0,0,0.6)',
                                                        border: 'none',
                                                        borderRadius: '50%',
                                                        width: '32px',
                                                        height: '32px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        zIndex: 10
                                                    }}
                                                    title="Delete Face Reference"
                                                >
                                                    <TrashIcon />
                                                </button>
                                            </div>
                                        ) : (
                                            <label htmlFor="face-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
                                                <div style={{ color: '#aaa', marginBottom: '8px' }}>📸</div>
                                                <div style={{ color: '#aaa' }}>Click to upload Model Face</div>
                                            </label>
                                        )}
                                    </div>
                                </div>

                                {/* Opener Images */}
                                <div className={styles.field}>
                                    <label>Opener Images (Chat Library)</label>
                                    <div className={assetStyles.openerGrid}>
                                        {openers.map((src, i) => (
                                            <div key={i} className={assetStyles.openerItem} style={{ position: 'relative' }}>
                                                <img src={src} alt={`Opener ${i}`} />
                                                <button
                                                    onClick={() => deleteAsset('opener', null, src)}
                                                    style={{
                                                        position: 'absolute',
                                                        top: '5px',
                                                        right: '5px',
                                                        background: 'rgba(0,0,0,0.6)',
                                                        border: 'none',
                                                        borderRadius: '50%',
                                                        width: '24px',
                                                        height: '24px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        padding: '4px'
                                                    }}
                                                >
                                                    <TrashIcon />
                                                </button>
                                            </div>
                                        ))}
                                        {/* ... Upload Button ... */}
                                        <div
                                            className={assetStyles.uploadZone}
                                            style={{ margin: 0, height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                                        >
                                            <input
                                                type="file"
                                                accept="image/*"
                                                style={{ display: 'none' }}
                                                id="opener-upload"
                                                onChange={(e) => e.target.files[0] && handleUpload('opener', e.target.files[0])}
                                            />
                                            <label htmlFor="opener-upload" style={{ cursor: 'pointer', fontSize: '24px' }}>+</label>
                                        </div>
                                    </div>
                                    <small style={{ color: '#666' }}>Bot will randomly pick one of these to start conversations.</small>
                                </div>

                                {/* Room Background */}
                                <div className={styles.field}>
                                    <label>Room Background (Optional)</label>
                                    <div className={assetStyles.uploadZone} style={{ position: 'relative' }}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            id="room-upload"
                                            onChange={(e) => e.target.files[0] && handleUpload('room', e.target.files[0])}
                                        />
                                        {roomRef ? (
                                            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                                <img src={roomRef} className={assetStyles.previewImage} alt="Room BG" />
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        deleteAsset('room', null, roomRef);
                                                    }}
                                                    style={{
                                                        position: 'absolute',
                                                        top: '10px',
                                                        right: '10px',
                                                        background: 'rgba(0,0,0,0.6)',
                                                        border: 'none',
                                                        borderRadius: '50%',
                                                        width: '32px',
                                                        height: '32px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        zIndex: 10
                                                    }}
                                                >
                                                    <TrashIcon />
                                                </button>
                                            </div>
                                        ) : (
                                            <label htmlFor="room-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
                                                <div style={{ color: '#aaa', marginBottom: '8px' }}>🖼️</div>
                                                <div style={{ color: '#aaa' }}>Click to upload Room Background</div>
                                            </label>
                                        )}
                                    </div>
                                </div>


                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
}
