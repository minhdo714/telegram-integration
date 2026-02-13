'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Navigation from '@/components/Navigation';
import AccountConnectionModal from '@/components/AccountConnectionModal';
import SaveConfigPresetModal from '@/components/SaveConfigPresetModal';
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
    const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
    const [isSavePresetModalOpen, setIsSavePresetModalOpen] = useState(false);

    // Asset States
    const [faceRef, setFaceRef] = useState(null);
    const [roomRef, setRoomRef] = useState(null);
    const [openers, setOpeners] = useState([]);
    const [draggedIndex, setDraggedIndex] = useState(null);

    // Outreach State
    const [usernames, setUsernames] = useState('');
    const [outreachMessage, setOutreachMessage] = useState('Hey {{name}}! Saw you in the {{group}} group... love your vibe\nHi {{name}}! Just saw your profile in {{group}}, hope you are well\nHey {{name}}! Found you through the {{group}} group, wanted to say hi\nHello {{name}}! Noticed you were also in {{group}}, thought I\'d reach out\nHi {{name}}, love your vibe in the {{group}} group! Just wanted to connect');
    const [isSending, setIsSending] = useState(false);
    const [stopRequested, setStopRequested] = useState(false);
    const [sentUsernames, setSentUsernames] = useState([]);
    const [failedUsernames, setFailedUsernames] = useState([]);
    const [currentTarget, setCurrentTarget] = useState(null);
    const [countdown, setCountdown] = useState(null); // safely tracks seconds remaining
    const [isRefreshing, setIsRefreshing] = useState(false);

    const checkSessionHealth = async (accountId) => {
        try {
            const res = await fetch(`/api/accounts/${accountId}/validate`, { method: 'POST' });
            const data = await res.json();
            if (data.status === 'invalid') {
                // Refresh accounts list to show updated status
                fetchAccounts();
            }
        } catch (error) {
            console.error('Failed to check session', error);
        }
    };

    const currentAccount = accounts.find(a => a.id === selectedAccountId);
    const isSessionExpired = currentAccount?.sessionStatus === 'expired';

    // Discovery States
    const [myGroups, setMyGroups] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [scrapedLeads, setScrapedLeads] = useState([]);
    const [aiKeywords, setAiKeywords] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [scrapingGroupId, setScrapingGroupId] = useState(null);
    const [selectedLeadIds, setSelectedLeadIds] = useState([]);
    const [niche, setNiche] = useState('dating');

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
        fetchLeads();
        const interval = setInterval(checkStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (selectedAccountId) {
            fetchAssets(selectedAccountId);
            fetchMyGroups(selectedAccountId);
            checkSessionHealth(selectedAccountId);
        } else {
            // Reset assets if no account
            setFaceRef(null);
            setRoomRef(null);
            setOpeners([]);
            setMyGroups([]);
        }
    }, [selectedAccountId]);

    const fetchAccounts = async () => {
        try {
            // Using userId=1 for MVP simplicity
            const res = await fetch('/api/accounts?userId=1');
            const data = await res.json();
            if (data.accounts) {
                setAccounts(data.accounts);

                // Auto-selection logic:
                if (!selectedAccountId && data.accounts.length > 0) {
                    // Default to the first account (most recent according to backend ordering)
                    setSelectedAccountId(data.accounts[0].id);
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
        setStopRequested(false);
        setSentUsernames([]);
        setFailedUsernames([]);
        setCurrentTarget(null);
        addLog(`[Outreach] Starting safe blast to ${targetList.length} users...`);
        addLog(`[Safety] Daily Cap set to: ${dailyCap} messages`);

        for (let i = 0; i < targetList.length; i++) {
            // Check if stop was requested
            if (stopRequested) {
                addLog('[Outreach] 🛑 Blast stopped by user.');
                break;
            }

            const user = targetList[i];
            const recipient = user.replace('@', '');
            setCurrentTarget(recipient);

            // Send Message
            addLog(`[Outreach] Sending to @${recipient} (${i + 1}/${targetList.length})...`);

            try {
                // Find data for this lead
                const leadData = scrapedLeads.find(l => l.username?.toLowerCase() === recipient.toLowerCase());
                const groupName = leadData?.group_name || "a shared";
                const firstName = leadData?.first_name || '';
                const userName = leadData?.username || '';
                const displayName = firstName.trim() || (userName ? `@${userName}` : 'there');

                // Support multiple variations (one per line)
                const variations = (outreachMessage || "Hey {{name}}! Found you through the {{group}} group, wanted to say hi").split('\n').filter(v => v.trim());
                let msgTemplate = variations[Math.floor(Math.random() * variations.length)];

                let msgToSend = msgTemplate.replace(/\{\{group\}\}/g, groupName);
                msgToSend = msgToSend.replace(/\{\{name\}\}/g, displayName);

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
                    setSentUsernames(prev => [...prev, recipient]);
                } else {
                    addLog(`[Outreach] ❌ Failed @${recipient}: ${data.message || data.error || 'Unknown error'}`);
                    setFailedUsernames(prev => [...prev, recipient]);
                }
            } catch (err) {
                addLog(`[Outreach] ❌ Error @${recipient}: ${err.message}`);
            }

            // SAFETY: Delay logic (only if not the last message)
            if (i < targetList.length - 1) {
                // If stop was requested after sending, don't start the next delay
                if (stopRequested) break;

                const minDelay = 5 * 60;
                const maxDelay = 15 * 60;
                const delaySeconds = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

                addLog(`[Safety] Waiting ${Math.floor(delaySeconds / 60)}m ${delaySeconds % 60}s before next...`);

                let remaining = delaySeconds;
                setCountdown(remaining);

                while (remaining > 0) {
                    if (stopRequested) {
                        setCountdown(null);
                        break;
                    }
                    await new Promise(r => setTimeout(r, 1000));
                    remaining--;
                    setCountdown(remaining);
                }
                setCountdown(null);

                // If stopped during the wait, break the main loop
                if (stopRequested) break;
            }
        }

        setIsSending(false);
        setStopRequested(false);
        setCountdown(null);
        addLog(`[Outreach] Batch ended. Stop signal: ${stopRequested ? 'Handled' : 'None'}`);
        fetchLeads(); // Refresh leads status
    };

    // --- Discovery Functions ---

    const fetchMyGroups = async (accountId) => {
        try {
            const res = await fetch(`/api/groups/my?accountId=${accountId}`);
            const data = await res.json();
            if (data.status === 'success') {
                setMyGroups(data.groups || []);
            }
        } catch (error) {
            console.error('Failed to fetch my groups', error);
        }
    };

    const handleGroupSearch = async () => {
        if (!selectedAccountId || !searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const res = await fetch(`/api/groups/search?accountId=${selectedAccountId}&q=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();
            if (data.status === 'success') {
                setSearchResults(data.groups || []);
            } else {
                addLog(`❌ Search failed: ${data.message}`);
            }
        } catch (error) {
            addLog(`❌ Search error: ${error.message}`);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSuggestKeywords = async () => {
        try {
            const res = await fetch('/api/ai/suggest-keywords', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ niche })
            });
            const data = await res.json();
            if (data.status === 'success') {
                setAiKeywords(data.keywords || []);
            }
        } catch (error) {
            console.error('Failed to suggest keywords', error);
        }
    };

    const handleScrapeGroup = async (groupId, limit = 50) => {
        if (!selectedAccountId) return alert('Select an account first');
        setScrapingGroupId(groupId);
        addLog(`[Scraper] Scraping members from ${groupId}...`);
        try {
            const res = await fetch('/api/groups/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accountId: selectedAccountId, groupId, limit })
            });
            const data = await res.json();
            if (data.status === 'success') {
                addLog(`✅ Successfully scraped ${data.leads_added} new leads!`);
                fetchLeads(); // Refresh table
            } else {
                addLog(`❌ Scrape failed: ${data.message}`);
            }
        } catch (error) {
            addLog(`❌ Scrape error: ${error.message}`);
        } finally {
            setScrapingGroupId(null);
        }
    };

    const toggleLeadSelection = (leadId) => {
        setSelectedLeadIds(prev =>
            prev.includes(leadId)
                ? prev.filter(id => id !== leadId)
                : [...prev, leadId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedLeadIds.length === scrapedLeads.length) {
            setSelectedLeadIds([]);
        } else {
            setSelectedLeadIds(scrapedLeads.map(l => l.id));
        }
    };

    const fetchLeads = async () => {
        try {
            const res = await fetch('/api/leads/list');
            const data = await res.json();
            if (data.status === 'success') {
                setScrapedLeads(data.leads || []);
                // Update username textarea with new leads if it's empty
                const newLeads = data.leads.filter(l => l.status === 'new' && l.username);
                if (newLeads.length > 0 && !usernames.trim()) {
                    setUsernames(newLeads.map(l => `@${l.username}`).join('\n'));
                }
            }
        } catch (error) {
            console.error('Failed to fetch leads', error);
        }
    };

    const handleJoinAndScrape = async (username) => {
        if (!selectedAccountId) return alert('Select an account');
        addLog(`[Discovery] Joining group @${username}...`);
        try {
            const res = await fetch('/api/groups/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accountId: selectedAccountId, username })
            });
            const data = await res.json();
            if (data.status === 'success') {
                addLog(`✅ Joined @${username}. Starting scrape...`);
                handleScrapeGroup(username);
            } else {
                addLog(`❌ Join failed: ${data.message}`);
            }
        } catch (error) {
            addLog(`❌ Join error: ${error.message}`);
        }
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

                        {accounts.length === 0 && !loading && (
                            <div className={styles.modal} style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.03)', margin: '0 auto', justifySelf: 'center' }}>
                                <div style={{ fontSize: '48px', marginBottom: '20px' }}>🤖</div>
                                <h2>No Bots Connected Yet</h2>
                                <p style={{ opacity: 0.7, marginBottom: '24px' }}>
                                    Connect your first Telegram account to start configuring your AI personality and discovery settings.
                                </p>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setIsConnectionModalOpen(true)}
                                    style={{ padding: '12px 32px', fontSize: '16px' }}
                                >
                                    🚀 Connect Your First Bot
                                </button>
                            </div>
                        )}

                        {/* Section 1: Bot Control */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {accounts.find(a => a.id === selectedAccountId)?.sessionStatus === 'expired' && (
                                <div style={{
                                    padding: '16px',
                                    background: 'rgba(255, 71, 87, 0.1)',
                                    border: '1px solid #ff4757',
                                    borderRadius: '12px',
                                    color: '#ff4757',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px'
                                }}>
                                    <span style={{ fontSize: '20px' }}>⚠️</span>
                                    <div style={{ flex: 1 }}>
                                        <strong style={{ display: 'block' }}>Session Expired</strong>
                                        <span style={{ fontSize: '14px', opacity: 0.8 }}>
                                            Your connection to Telegram has been lost. Please re-link this account to continue.
                                        </span>
                                    </div>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => setIsConnectionModalOpen(true)}
                                        style={{ background: '#ff4757', padding: '8px 16px', fontSize: '13px' }}
                                    >
                                        🔄 Re-link Now
                                    </button>
                                </div>
                            )}
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
                                {currentAccount?.activeConfigName && (
                                    <div style={{
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        background: 'rgba(99, 102, 241, 0.1)',
                                        color: '#6366f1',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        border: '1px solid rgba(99, 102, 241, 0.2)'
                                    }}>
                                        PRESET: {currentAccount.activeConfigName}
                                    </div>
                                )}
                            </div>
                            <div className={styles.form}>
                                <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => setIsSavePresetModalOpen(true)}
                                        style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', fontSize: '13px', padding: '8px 16px' }}
                                    >
                                        💾 Save Current as Preset
                                    </button>
                                </div>

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

                        {/* Section 3: Lead Discovery & Outreach - Restructured */}
                        <div className={styles.modal} style={{ margin: 0, width: '100%', maxWidth: 'none', background: 'rgba(255,255,255,0.03)', gridColumn: '1 / -1' }}>
                            <div className={styles.header}>
                                <h2>Lead Discovery & Outreach</h2>
                            </div>

                            <div className={styles.form} style={{ padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '40px' }}>

                                {/* 1. Find New Prospects (Priority) */}
                                <div className={assetStyles.discoveryPanel}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                        <h3 style={{ margin: 0 }}>Find New Prospects</h3>
                                        <InfoTooltip text="Find and connect with targeted users from public Telegram groups. Benefit: Reach beyond your current network and find high-intent leads in your specific niche." />
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                                        <input
                                            type="text"
                                            placeholder="Niche (e.g. egirl, onlyfans, dating)..."
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            className={assetStyles.searchInput}
                                            onKeyPress={(e) => e.key === 'Enter' && handleGroupSearch()}
                                        />
                                        <button
                                            className="btn btn-primary"
                                            onClick={handleGroupSearch}
                                            disabled={isSearching || isSessionExpired}
                                        >
                                            {isSearching ? 'Searching...' : 'Search'}
                                        </button>
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                            <small style={{ color: '#888' }}>AI SUGGESTIONS:</small>
                                            <button className="btn" style={{ fontSize: '10px', padding: '2px 8px' }} onClick={handleSuggestKeywords}>Regenerate</button>
                                        </div>
                                        <div className={assetStyles.keywordGrid}>
                                            {aiKeywords.map((k, i) => (
                                                <span key={i} className={assetStyles.keywordPill} onClick={() => setSearchQuery(k)}>{k}</span>
                                            ))}
                                            {aiKeywords.length === 0 && <small style={{ color: '#555' }}>Click regenerate for AI suggestions.</small>}
                                        </div>
                                    </div>

                                    <div className={assetStyles.resultList}>
                                        {searchResults.map(group => (
                                            <div key={group.id} className={assetStyles.resultItem}>
                                                <div className={assetStyles.groupInfo}>
                                                    <strong>{group.title}</strong>
                                                    <span>@{group.username} • {group.member_count} members</span>
                                                </div>
                                                <button
                                                    className="btn"
                                                    style={{ fontSize: '12px', background: isSessionExpired ? '#444' : '#2ed573' }}
                                                    onClick={() => !isSessionExpired && handleJoinAndScrape(group.username || group.id)}
                                                    disabled={isSessionExpired}
                                                >
                                                    {isSessionExpired ? 'Session Expired' : 'Join & Scrape'}
                                                </button>
                                                {isSessionExpired && (
                                                    <small style={{ color: '#ff4757', display: 'block', marginTop: '4px', textAlign: 'right' }}>
                                                        Please re-link at the top of the page.
                                                    </small>
                                                )}
                                            </div>
                                        ))}
                                        {searchResults.length === 0 && !isSearching && <p style={{ color: '#666' }}>Try searching for a niche or keyword.</p>}
                                    </div>
                                </div>

                                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', margin: 0 }} />

                                {/* 2. Scan My Groups */}
                                <div className={assetStyles.discoveryPanel}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                        <h3 style={{ margin: 0 }}>Scan My Groups</h3>
                                        <InfoTooltip text="Extract active leads from the Telegram groups you have already joined. Benefit: Automatically discover potential customers hiding in your existing communities." />
                                        <button className="btn" style={{ fontSize: '12px', padding: '4px 12px', marginLeft: 'auto' }} onClick={() => fetchMyGroups(selectedAccountId)}>Refresh</button>
                                    </div>
                                    <div className={assetStyles.groupGrid}>
                                        {myGroups.map(group => (
                                            <div key={group.id} className={assetStyles.groupCard}>
                                                <div className={assetStyles.groupInfo}>
                                                    <strong>{group.title}</strong>
                                                    <span>{group.member_count} members</span>
                                                </div>
                                                <button
                                                    className="btn btn-primary"
                                                    style={{ fontSize: '12px', padding: '6px' }}
                                                    onClick={() => handleScrapeGroup(group.id)}
                                                    disabled={scrapingGroupId === group.id || isSessionExpired}
                                                >
                                                    {isSessionExpired ? 'Expired' : (scrapingGroupId === group.id ? 'Scraping...' : 'Scrape')}
                                                </button>
                                            </div>
                                        ))}
                                        {myGroups.length === 0 && <p style={{ color: '#666' }}>No groups found or account not selected.</p>}
                                    </div>
                                </div>

                                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', margin: 0 }} />

                                {/* 3. Prospect Database */}
                                <div className={assetStyles.discoveryPanel}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                        <h3 style={{ margin: 0 }}>Prospect Database ({scrapedLeads.length})</h3>
                                        <InfoTooltip text="A centralized view of all discovered leads, including their source group and outreach status. Benefit: Keep track of every relationship and ensure no lead is missed." />
                                        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                                            <button className="btn" style={{ fontSize: '12px' }} onClick={fetchLeads}>Refresh</button>
                                            <button
                                                className="btn"
                                                style={{ fontSize: '12px' }}
                                                onClick={toggleSelectAll}
                                            >
                                                {selectedLeadIds.length === scrapedLeads.length && scrapedLeads.length > 0 ? 'Deselect All' : 'Select All'}
                                            </button>
                                            <button className="btn btn-primary" style={{ fontSize: '12px' }} onClick={() => {
                                                const selectedLeads = scrapedLeads.filter(l => selectedLeadIds.includes(l.id) && l.username);
                                                if (selectedLeads.length === 0) return alert('Please select at least one prospect with a username');
                                                setUsernames(selectedLeads.map(l => `@${l.username}`).join('\n'));
                                                // Scroll to outreach section
                                                document.getElementById('outreach-campaign')?.scrollIntoView({ behavior: 'smooth' });
                                            }}>Sync Selected to Outreach</button>
                                        </div>
                                    </div>
                                    <div className={assetStyles.leadTableContainer}>
                                        <table className={assetStyles.leadTable}>
                                            <thead>
                                                <tr>
                                                    <th style={{ width: '40px' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedLeadIds.length === scrapedLeads.length && scrapedLeads.length > 0}
                                                            onChange={toggleSelectAll}
                                                            style={{ cursor: 'pointer' }}
                                                        />
                                                    </th>
                                                    <th>Name</th>
                                                    <th>Username</th>
                                                    <th>Source Group</th>
                                                    <th>Status</th>
                                                    <th>Scraped At</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {scrapedLeads.map(lead => (
                                                    <tr key={lead.id}>
                                                        <td>
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedLeadIds.includes(lead.id)}
                                                                onChange={() => toggleLeadSelection(lead.id)}
                                                                style={{ cursor: 'pointer' }}
                                                            />
                                                        </td>
                                                        <td>{lead.first_name} {lead.last_name}</td>
                                                        <td style={{ color: 'var(--color-primary)' }}>@{lead.username || 'N/A'}</td>
                                                        <td>{lead.group_name}</td>
                                                        <td>
                                                            <span className={`${assetStyles.statusBadge} ${assetStyles[lead.status]}`}>
                                                                {lead.status.toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td style={{ fontSize: '10px', color: '#888' }}>
                                                            {new Date(lead.scraped_at).toLocaleDateString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {scrapedLeads.length === 0 && (
                                                    <tr>
                                                        <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                                                            No leads scraped yet. Use "Find New Prospects" to grow your list.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', margin: 0 }} />

                                {/* 4. Smart Outreach Campaign */}
                                <div id="outreach-campaign" className={assetStyles.discoveryPanel}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                        <h3 style={{ margin: 0 }}>Smart Outreach Campaign</h3>
                                        <InfoTooltip text="Set up and start your automated outreach blast with safety delays. Benefit: Initiate meaningful conversations at scale while protecting your account from bans." />
                                    </div>
                                    <div className={styles.field} style={{ marginBottom: '16px' }}>
                                        <label>Outreach Opener / Vibe</label>
                                        <small style={{ color: '#888', marginTop: '4px', display: 'block', marginBottom: '12px' }}>
                                            Use <code>{"{{group}}"}</code> for group name and <code>{"{{name}}"}</code> for lead name.<br />
                                            <strong>Pro Tip:</strong> Enter multiple lines to randomize the opener for each person!
                                        </small>
                                        <textarea
                                            value={outreachMessage}
                                            onChange={e => setOutreachMessage(e.target.value)}
                                            placeholder="Hey {{name}}! Saw you in the {{group}} group..."
                                            style={{ width: '100%', height: '120px', padding: '10px', borderRadius: '8px', background: '#333', color: 'white', border: '1px solid #555', marginBottom: '16px' }}
                                        />

                                        <label>Blast List (Usernames)</label>
                                        {isSending ? (
                                            <div style={{
                                                width: '100%',
                                                height: '120px',
                                                padding: '10px',
                                                borderRadius: '8px',
                                                background: '#222',
                                                border: '1px solid #555',
                                                overflowY: 'auto',
                                                fontFamily: 'monospace',
                                                fontSize: '13px'
                                            }}>
                                                {usernames.split('\n').filter(u => u.trim()).map((u, idx) => {
                                                    const cleanU = u.trim().replace('@', '');
                                                    const isSent = sentUsernames.includes(cleanU);
                                                    const isFailed = failedUsernames.includes(cleanU);
                                                    const isCurrent = currentTarget === cleanU;

                                                    let statusText = '';
                                                    let style = { padding: '2px 0', borderBottom: '1px solid #333' };

                                                    if (isSent) {
                                                        statusText = ' ✅ SENT';
                                                        style.opacity = 0.5;
                                                        style.color = '#4ade80';
                                                    } else if (isFailed) {
                                                        statusText = ' ❌ FAILED';
                                                        style.color = '#f87171';
                                                    } else if (isCurrent) {
                                                        statusText = ' ⏳ SENDING...';
                                                        style.color = '#6366f1';
                                                        style.fontWeight = 'bold';
                                                    }

                                                    return (
                                                        <div key={idx} style={style}>
                                                            {u}{statusText}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <textarea
                                                value={usernames}
                                                onChange={e => setUsernames(e.target.value)}
                                                placeholder="@user1&#10;@user2"
                                                style={{ width: '100%', height: '120px', padding: '10px', borderRadius: '8px', background: '#333', color: 'white', border: '1px solid #555', fontFamily: 'monospace', fontSize: '13px' }}
                                            />
                                        )}
                                        <small style={{ color: '#888', marginTop: '4px', display: 'block' }}>
                                            {usernames.split('\n').filter(u => u.trim()).length} targets in queue.
                                        </small>
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                        <button
                                            onClick={handleStartOutreach}
                                            disabled={isSending || !selectedAccountId}
                                            className="btn btn-primary"
                                            style={{ flex: 4, opacity: isSending ? 0.7 : 1, background: '#6366f1', padding: '16px', fontWeight: 'bold' }}
                                        >
                                            {isSending ? (countdown ? `Resuming in ${formatTime(countdown)}...` : 'Sending...') : 'Start Outreach Blast 🚀'}
                                        </button>

                                        {isSending && (
                                            <button
                                                onClick={() => {
                                                    setStopRequested(true);
                                                    addLog('[Outreach] 🛑 Stopping blast... please wait.');
                                                }}
                                                disabled={stopRequested}
                                                className="btn btn-danger"
                                                style={{ flex: 1, background: '#ef4444', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: stopRequested ? 'not-allowed' : 'pointer' }}
                                            >
                                                {stopRequested ? '...' : '🛑 STOP'}
                                            </button>
                                        )}
                                    </div>
                                    {isSending && countdown > 0 && (
                                        <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '8px', textAlign: 'center', fontSize: '13px', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                                            🛡️ Safety Delay: Resuming in <strong>{formatTime(countdown)}</strong>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>


                </div>

                {isConnectionModalOpen && (
                    <AccountConnectionModal
                        isOpen={isConnectionModalOpen}
                        onClose={() => setIsConnectionModalOpen(false)}
                        onSuccess={(newAccount) => {
                            setIsConnectionModalOpen(false);
                            fetchAccounts().then(() => {
                                if (newAccount && newAccount.id) {
                                    setSelectedAccountId(newAccount.id);
                                    toast.success(`Connected as ${newAccount.username || newAccount.phone}`);
                                }
                            });
                        }}
                    />
                )}

                <SaveConfigPresetModal
                    isOpen={isSavePresetModalOpen}
                    onClose={() => setIsSavePresetModalOpen(false)}
                    currentAssets={{ faceRef, roomRef, openers }}
                    onSave={() => { }}
                />
            </div >
        </>
    );
}
