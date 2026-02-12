'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import styles from '@/components/MessageComposer.module.css'; // Global container styles
import assetStyles from './AIConfig.module.css'; // New asset specific styles

// Info Tooltip Component
function InfoTooltip({ text }) {
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
    const iconRef = useRef(null);

    const updatePosition = (element) => {
        if (!element) return;
        const rect = element.getBoundingClientRect();
        const tooltipWidth = 280;
        const padding = 20;

        let left = rect.left;
        let top = rect.bottom + 8;

        // Prevent overflow on the right
        if (left + tooltipWidth > window.innerWidth - padding) {
            left = window.innerWidth - tooltipWidth - padding;
        }

        // Prevent overflow on the left
        if (left < padding) {
            left = padding;
        }

        setTooltipPos({ top, left });
    };

    return (
        <div
            className={assetStyles.tooltipContainer}
            ref={iconRef}
            onMouseEnter={(e) => {
                setShowTooltip(true);
                updatePosition(e.currentTarget);
            }}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={(e) => {
                const newState = !showTooltip;
                setShowTooltip(newState);
                if (newState) updatePosition(e.currentTarget);
            }}
        >
            <span className={assetStyles.infoIcon}>ℹ️</span>
            {showTooltip && (
                <div
                    className={assetStyles.tooltip}
                    style={{
                        top: `${tooltipPos.top}px`,
                        left: `${tooltipPos.left}px`
                    }}
                >
                    {text}
                </div>
            )}
        </div>
    );
}

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
    const [draggedIndex, setDraggedIndex] = useState(null);

    // Outreach State
    const [usernames, setUsernames] = useState('');
    const [outreachMessage, setOutreachMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [countdown, setCountdown] = useState(null); // safely tracks seconds remaining

    // Timer effect for countdown
    useEffect(() => {
        let timer;
        if (countdown !== null && countdown > 0) {
            timer = setInterval(() => {
                setCountdown(prev => (prev > 0 ? prev - 1 : 0));
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [countdown]);

    // Format seconds into MM:SS
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

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

    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const newOpeners = [...openers];
        const draggedItem = newOpeners[draggedIndex];
        newOpeners.splice(draggedIndex, 1);
        newOpeners.splice(index, 0, draggedItem);

        setOpeners(newOpeners);
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
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

    const handleStartOutreach = async () => {
        if (!selectedAccountId) return alert('Please select an account');
        if (!usernames.trim()) return alert('Please enter at least one username');

        const userList = usernames.split(/[\n,]+/).map(u => u.trim()).filter(u => u);
        if (userList.length === 0) return alert('No valid usernames found');

        // SAFETY: Random Daily Cap between 15 and 30
        const dailyCap = Math.floor(Math.random() * (30 - 15 + 1)) + 15;
        const targetList = userList.slice(0, dailyCap);

        if (userList.length > dailyCap) {
            alert(`SAFETY LIMIT: Sending to only first ${dailyCap} users to prevent ban. (Daily Cap: 15-30)`);
        }

        setIsSending(true);
        addLog(`[Outreach] Starting safe blast to ${targetList.length} users...`);
        addLog(`[Safety] Daily Cap set to: ${dailyCap} messages`);

        for (let i = 0; i < targetList.length; i++) {
            const user = targetList[i];
            const recipient = user.replace('@', '');

            // Send Message
            addLog(`[Outreach] Sending to @${recipient} (${i + 1}/${targetList.length})...`);

            try {
                const msgToSend = outreachMessage || "Hey! Saw you on my feed...";

                const res = await fetch('/api/messages/send', {
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
                    addLog(`[Outreach] ❌ Failed @${recipient}: ${data.message || data.error || 'Unknown error'}`);
                }
            } catch (err) {
                addLog(`[Outreach] ❌ Error @${recipient}: ${err.message}`);
            }

            // SAFETY: Delay logic (only if not the last message)
            if (i < targetList.length - 1) {
                // Random delay between 5 to 15 minutes (300 to 900 seconds)
                const minDelay = 5 * 60;
                const maxDelay = 15 * 60;
                const delaySeconds = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

                addLog(`[Safety] Waiting ${Math.floor(delaySeconds / 60)}m ${delaySeconds % 60}s before next...`);

                setCountdown(delaySeconds);

                // Wait for the delay
                await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));

                setCountdown(null);
            }
        }

        setIsSending(false);
        setCountdown(null);
        addLog('[Outreach] Batch complete. Stay safe! 🛡️');
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

                    <div className={assetStyles.configGrid}>

                        {/* Section 1: Bot Control */}
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
                        </div>

                        {/* Section 2: Bot Identity & Assets */}
                        <div className={styles.modal} style={{ margin: 0, width: '100%', maxWidth: 'none', background: 'rgba(255,255,255,0.03)' }}>
                            <div className={styles.header}>
                                <h2>Bot Identity & Assets</h2>
                            </div>
                            <div className={styles.form}>

                                {/* Account Selector */}
                                <div className={styles.field}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <label style={{ margin: 0 }}>Select Account to Configure</label>
                                        <InfoTooltip text="Choose which Telegram account you want to customize. Each account can have its own unique AI personality, photos, and conversation style." />
                                    </div>
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
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <label style={{ margin: 0 }}>Model Face Reference (Mandatory)</label>
                                        <InfoTooltip text="Upload a clear photo of the model's face. The AI will use this to generate custom images when fans request photos. This ensures all generated content looks like the same person and maintains authenticity." />
                                    </div>
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
                                                <label htmlFor="face-upload" style={{ cursor: 'pointer', display: 'block', width: '100%', height: '100%' }} title="Click to Replace">
                                                    <img src={faceRef} className={assetStyles.previewImage} alt="Face Ref" />
                                                </label>
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
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <label style={{ margin: 0 }}>Opener Images (Chat Library)</label>
                                        <InfoTooltip text="Upload teaser photos that the bot will randomly send when starting new conversations. These are your 'hello' images that hook fans right away and get them interested. The more variety, the better!" />
                                    </div>
                                    <div className={assetStyles.openerGrid}>
                                        {openers.map((src, i) => (
                                            <div
                                                key={i}
                                                className={assetStyles.openerItem}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, i)}
                                                onDragOver={(e) => handleDragOver(e, i)}
                                                onDragEnd={handleDragEnd}
                                                style={{
                                                    opacity: draggedIndex === i ? 0.5 : 1,
                                                    cursor: 'grab'
                                                }}
                                            >
                                                <img
                                                    src={src}
                                                    alt={`Opener ${i + 1}`}
                                                    draggable={false}
                                                />
                                                <button
                                                    className={assetStyles.deleteBtn}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteAsset('opener', null, src);
                                                    }}
                                                    title="Delete image"
                                                >
                                                    ✕
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


                            </div>
                        </div>

                        {/* Section 3: Automated Outreach */}
                        <div className={styles.modal} style={{ margin: 0, width: '100%', maxWidth: 'none', background: 'rgba(255,255,255,0.03)' }}>
                            <div className={styles.header}>
                                <h2>Automated Outreach</h2>
                            </div>
                            <div className={styles.form}>
                                <div className={styles.field}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <label style={{ margin: 0 }}>Your sample chats (Optional)</label>
                                        <InfoTooltip text="Paste examples of your natural conversation style. The AI will learn from these to make automated messages sound authentic and match your personality." />
                                    </div>
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
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <label style={{ margin: 0 }}>Target Usernames (One per line)</label>
                                        <InfoTooltip text="List Telegram usernames to automatically message. The system sends 15-30 messages per day with 5-15 minute delays between each to avoid bans and stay safe." />
                                    </div>
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
                                    {isSending ? (countdown ? `Waiting ${formatTime(countdown)}...` : 'Sending...') : 'Start Blast 🚀'}
                                </button>
                                {isSending && countdown > 0 && (
                                    <div style={{ marginTop: '8px', textAlign: 'center', fontSize: '12px', color: '#fbbf24' }}>
                                        ⚠️ Safety Delay Active: Resumes in {formatTime(countdown)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>


                </div>
            </div>
        </>
    );
}
