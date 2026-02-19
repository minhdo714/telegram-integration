'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Navigation from '@/components/Navigation';
import AccountConnectionModal from '@/components/AccountConnectionModal';
import SaveConfigPresetModal from '@/components/SaveConfigPresetModal';
import LoadConfigPresetModal from '@/components/LoadConfigPresetModal';
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

function AIConfigContent() {
    const searchParams = useSearchParams();
    const [accounts, setAccounts] = useState([]);
    const [selectedAccountId, setSelectedAccountId] = useState(searchParams.get('accountId') || '');
    const [botStatus, setBotStatus] = useState('stopped');
    const [pid, setPid] = useState(null);
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState([]);
    const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
    const [isSavePresetModalOpen, setIsSavePresetModalOpen] = useState(false);
    const [isLoadPresetModalOpen, setIsLoadPresetModalOpen] = useState(false);

    // Asset States
    const [faceRef, setFaceRef] = useState(null);
    const [roomRef, setRoomRef] = useState(null);
    const [openers, setOpeners] = useState([]);
    const [draggedIndex, setDraggedIndex] = useState(null);

    // Outreach State
    const [usernames, setUsernames] = useState('');
    const [blastListMode, setBlastListMode] = useState('text'); // 'text' | 'list'
    const [selectedBlastItems, setSelectedBlastItems] = useState(new Set());
    const [outreachMessage, setOutreachMessage] = useState([
        "did you really just say that in {{group}}? i'm dying lol",
        "ok i have a confession to make about why i'm DMing you from {{group}}...",
        "wait, are you the same {{name}} that's always in {{group}}? i think i remember you",
        "i was just scrolling {{group}} and your profile hit me like a brick",
        "quick question about something you posted in {{group}}... promise i'm not a creep",
        "i feel like we'd either be best friends or worst enemies based on {{group}} lol",
        "hey {{name}}, i saw you in {{group}} and just had a random thought... curious what you'd think",
        "your energy in {{group}} is... a lot. in a good way though 😉",
        "i usually don't do this but {{group}} led me to you and i'm taking it as a sign",
        "stop me if this is weird, but i noticed you in {{group}} and had to say hi",
        "you seem like the type of person who causes trouble in {{group}}... am i right?",
        "just saw your name in {{group}} and suddenly i'm distracted. thanks for that.",
        "hey {{name}}, you win the prize for 'most intriguing person in {{group}}' today",
        "i've been lurking in {{group}} for a bit and i think you're the only sane one there",
        "how's your day treating you? (saw you in {{group}} and figured i'd check in)",
        "um, i hope i'm not interrupting anything but {{group}} led me here...",
        "your profile in {{group}} caught my eye and now i'm curious about the human behind it",
        "ok, tell the truth... what's your secret to being so active in {{group}}?",
        "hey {{name}}, i'm the one who just saw you in {{group}} and decided life is too short not to say hi",
        "you caught my attention in {{group}}... let's see if you can keep it",
        "curiosity got the better of me after seeing you in {{group}}... what's up?",
        "saw you in {{group}} and had to double take. wow.",
        "hey {{name}}, if i guess what you're doing right now (based on {{group}} vibes) do i get a prize?",
        "i feel like you're the main character of {{group}} today lol",
        "honestly? seeing you in {{group}} was the highlight of my scrolls today",
        "hey {{name}}, quick poll: are people in {{group}} usually this wild or is it just you?",
        "i was gonna keep scrolling through {{group}} but then i saw you and... here we are",
        "hey {{name}}, do you always stand out this much in groups like {{group}}?",
        "saw you in {{group}} and i just have this feeling we'd vibe. hi!",
        "ok fine, you caught me. i'm the girl from {{group}} who thinks you're interesting.",
        "so... {{group}} brought us together. what are you gonna do about it? 😉",
        "hey {{name}}, i hope your evening is as interesting as your profile in {{group}}",
        "i was looking for something else in {{group}} but i found you instead. better deal.",
        "is it just me or is {{group}} getting boring? you seemed like the only interesting part.",
        "hey {{name}}, i saw you in {{group}} and i'm making a snap judgment: you're fun to talk to.",
        "i'm usually shy but {{group}} gave me a boost of confidence to DM you",
        "you have a very specific 'dont mess with me' vibe in {{group}} and i'm into it lol",
        "hey {{name}}, caught you in {{group}}. how's the real world treating you today?",
        "i'll keep it brief: saw you in {{group}}, thought you were hot, had to say hey.",
        "you seem like you have some stories to tell based on {{group}}. i'm all ears.",
        "hey {{name}}, i'm starting a rebellion against {{group}} boredom. you in?",
        "i saw your profile in {{group}} and now i have questions. many questions.",
        "don't mean to be a total stranger but {{group}} made me feel like i already know you",
        "hey {{name}}, saw you in {{group}} and i just had to know... what's your go-to weekend vibe?",
        "i was just thinking how {{group}} needs more people like you. hi!",
        "okay, i'm officially curious about you after seeing you in {{group}}",
        "hey {{name}}, is it weird that i recognized you from {{group}}? you're hard to miss.",
        "saw you in {{group}} and i'm betting $5 that you're even cooler in private chat",
        "hey {{name}}, i saw you in {{group}} and decided to skip the small talk... what's on your mind?",
        "you're the first person from {{group}} i've actually wanted to talk to. congrats 😉",
        "hey {{name}}, saw you in {{group}} and i'm just here to disrupt your day in a good way",
        "i was gonna say something clever about {{group}} but i forgot it when i saw your profile",
        "hey {{name}}, found you in {{group}}. you look like you need a distraction.",
        "saw you in {{group}}... you seem like the type of trouble i like."
    ].join('\n'));
    const [exampleChatflow, setExampleChatflow] = useState(`Aria: Hey, I couldn't help but notice your vibe in the [group name] chat – you seem like someone who really gets the thrill of it all. Rough day or just chilling? 😏
User: Just chilling, yeah.
Aria: Nice, everyone needs that escape sometimes. What drew you into the group anyway? Looking for some fun convos or something more specific? I'm all ears, hun.
User: Looking for some hot chats, honestly.
Aria: Mmm, I totally get that – life's too short not to indulge in what excites you. That sounds super intriguing... tell me more, what's your go-to fantasy that gets you going? No judgment here, promise. 💕
User: Love roleplay, like nurse-patient stuff.
Aria: Oh damn, that's hot! I love how creative that can get – makes everything so intense and personal. What part of it turns you on the most? The teasing build-up or jumping right into the action?
User: The teasing for sure.
Aria: Yesss, the slow burn is everything, right? Builds that anticipation until you can't take it anymore. 😈 Speaking of, it's like 2:30 PM here in LA and I'm feeling that vibe myself after a long morning shoot. What time is it where you are? Helps me picture you better.
User: It's evening here.
Aria: Evening vibes are perfect for unwinding like this. So, about that nurse fantasy... if you're up for it, I could slip into something fitting and send you a little tease. Sound fun? Just tell me what you'd wanna see first – I'm here to make it just right for you. 🌹
User: Can I see you in a nurse outfit?
Aria: Absolutely, babe – love catering to what gets you hot. [Sends on-demand image of self in nurse outfit] How's that hitting for you? Makes me wet just thinking about playing doctor with you... want me to describe what I'd do next, or maybe go live for a private show? It's $20 for 10 mins of us getting naughty together, totally customized. Your call. 🔥
User: Let's do the live show.
Aria: Perfect choice, hun – you're gonna love this. Send the tip via [PPV link or Telegram payment], and I'll set up our private video chat right away. Can't wait to hear you moan while I take care of you... what's one thing you want me to focus on during it? 😘`);
    const [sendTeasePic, setSendTeasePic] = useState(true);
    const [teasePreview, setTeasePreview] = useState(false);
    const [teaseThumbVersion, setTeaseThumbVersion] = useState(0);
    const teaseInputRef = useRef(null);
    const [isSending, setIsSending] = useState(false);
    const [stopRequested, setStopRequested] = useState(false);
    const [sentUsernames, setSentUsernames] = useState([]);
    const [failedUsernames, setFailedUsernames] = useState([]);
    const [currentTarget, setCurrentTarget] = useState(null);
    const [countdown, setCountdown] = useState(null); // safely tracks seconds remaining
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Helper for Tease Upload
    const handleTeaseUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload/tease', { method: 'POST', body: formData });
            if (res.ok) {
                setTeaseThumbVersion(Date.now());
                toast.success('Tease pic updated!');
            } else {
                toast.error('Upload failed');
            }
        } catch (err) {
            console.error(err);
            toast.error('Upload error');
        }
    };

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
            const userId = document.cookie.split('; ').find(row => row.startsWith('user_id='))?.split('=')[1] || '1';
            const res = await fetch(`/api/accounts?userId=${userId}`);
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
                if (data.assets.outreach_message) setOutreachMessage(data.assets.outreach_message);
                if (data.assets.example_chatflow) setExampleChatflow(data.assets.example_chatflow);

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

                if (data.assets.blast_list) {
                    setUsernames(data.assets.blast_list);
                    if (data.assets.blast_list.includes('\n')) setBlastListMode('list');
                } else {
                    setUsernames(''); // Clear if not found
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
                const groupName = leadData?.group_name || '';
                const firstName = leadData?.first_name || '';
                // Always fall back to the actual @username so {{name}} is never blank
                const displayName = firstName.trim() || `@${recipient}`;

                // Support multiple variations (one per line)
                const variations = (outreachMessage || "Hey {{name}}! Found you through the {{group}} group, wanted to say hi").split('\n').filter(v => v.trim());
                let msgTemplate = variations[Math.floor(Math.random() * variations.length)];

                let msgToSend = msgTemplate;
                if (groupName) {
                    msgToSend = msgToSend.replace(/\{\{group\}\}/g, groupName);
                } else {
                    // Remove any phrase containing {{group}} so message reads naturally
                    msgToSend = msgToSend.replace(/\s*(through the|from|in|via)\s+\{\{group\}\}\s*(group)?/gi, '');
                    msgToSend = msgToSend.replace(/\{\{group\}\}/g, 'the group');
                }
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

                    // TEASE PIC LOGIC
                    if (sendTeasePic) {
                        try {
                            addLog(`[Outreach] 📸 Triggering Tease Pic for @${recipient}...`);
                            fetch('/api/bot/tease', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    accountId: selectedAccountId,
                                    recipient: recipient,
                                    leadName: firstName || recipient,
                                    groupName: groupName
                                })
                            }).then(teaseRes => teaseRes.json())
                                .then(teaseData => {
                                    if (teaseData.status === 'started') {
                                        addLog(`[Outreach] 📸 Tease pic generation started.`);
                                    } else {
                                        addLog(`[Outreach] ⚠️ Tease pic error: ${teaseData.error}`);
                                    }
                                }).catch(e => console.error(e));
                        } catch (teaseErr) {
                            console.error("Tease trigger failed", teaseErr);
                        }
                    }

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

    // --- Blast List Management ---
    const getBlastListArray = () => usernames.split('\n').filter(u => u.trim());

    const handleToggleBlastMode = () => {
        if (blastListMode === 'text') {
            setBlastListMode('list');
            setSelectedBlastItems(new Set());
        } else {
            setBlastListMode('text');
        }
    };

    const handleSelectBlastItem = (index) => {
        const newSelected = new Set(selectedBlastItems);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedBlastItems(newSelected);
    };

    const handleSelectAllBlastItems = () => {
        const list = getBlastListArray();
        if (selectedBlastItems.size === list.length) {
            setSelectedBlastItems(new Set());
        } else {
            const newSelected = new Set();
            list.forEach((_, i) => newSelected.add(i));
            setSelectedBlastItems(newSelected);
        }
    };

    const handleDeleteBlastItem = (index) => {
        const list = getBlastListArray();
        const newList = list.filter((_, i) => i !== index);
        setUsernames(newList.join('\n'));
        // Adjust selection indices if needed, but for simplicity reset selection or filtered
        if (selectedBlastItems.has(index)) {
            const newSelected = new Set(selectedBlastItems);
            newSelected.delete(index);
            setSelectedBlastItems(newSelected);
        }
    };

    const handleDeleteSelectedBlastItems = () => {
        const list = getBlastListArray();
        const newList = list.filter((_, i) => !selectedBlastItems.has(i));
        setUsernames(newList.join('\n'));
        setSelectedBlastItems(new Set());
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

    const handleSaveAssets = async () => {
        if (!selectedAccountId) {
            toast.error('Please select an account first!');
            return;
        }

        try {
            const res = await fetch('/api/assets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accountId: selectedAccountId,
                    model_face_ref: faceRef?.replace('/api/uploads/', ''),
                    model_body_ref: null,
                    room_bg_ref: roomRef?.replace('/api/uploads/', ''),
                    opener_images: JSON.stringify(openers.map(p => p.replace('/api/uploads/', ''))),
                    outreach_message: outreachMessage,
                    example_chatflow: exampleChatflow,
                    blast_list: usernames
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                toast.success('Configuration saved!');
            } else {
                toast.error(data.error || 'Failed to save');
            }
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Network error during save');
        }
    };

    const handlePresetLoaded = (preset) => {
        // Populate state from preset
        const getProxyUrl = (relativePath) => relativePath ? `/api/uploads/${relativePath}` : null;

        if (preset.model_face_ref) setFaceRef(getProxyUrl(preset.model_face_ref));
        if (preset.room_bg_ref) setRoomRef(getProxyUrl(preset.room_bg_ref));
        if (preset.outreach_message) setOutreachMessage(preset.outreach_message);
        if (preset.example_chatflow) setExampleChatflow(preset.example_chatflow);
        if (preset.blast_list) setUsernames(preset.blast_list);

        if (preset.opener_images) {
            try {
                const parsed = JSON.parse(preset.opener_images);
                setOpeners(parsed.map(p => getProxyUrl(p)));
            } catch (e) {
                setOpeners([]);
            }
        }
    };



    const handleBulkDeleteLeads = async () => {
        if (selectedLeadIds.length === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedLeadIds.length} leads?`)) return;

        try {
            console.log('Sending bulk delete request...');
            const res = await fetch('/api/leads/bulk-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leadIds: selectedLeadIds })
            });
            console.log('Bulk delete response status:', res.status);
            const data = await res.json();
            console.log('Bulk delete response data:', data);

            if (res.ok) {
                toast.success(`Deleted ${data.deleted_count} leads`);
                setSelectedLeadIds([]);
                fetchLeads();
            } else {
                toast.error(`Bulk delete failed: ${data.message || data.error}`);
                console.error('Bulk delete error:', data.error);
            }
        } catch (error) {
            console.error('Bulk delete error:', error);
            toast.error('Bulk delete failed');
        }
    };

    const handleDeleteLead = async (lead_id) => {
        if (!confirm('Are you sure you want to delete this lead?')) return;
        try {
            const res = await fetch(`/api/leads/${lead_id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.status === 'success') {
                toast.success('Lead deleted');
                fetchLeads();
            } else {
                toast.error(`Delete failed: ${data.message || data.error}`);
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Delete failed');
        }
    };

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
                                    <button
                                        className="btn"
                                        onClick={() => setIsLoadPresetModalOpen(true)}
                                        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', fontSize: '13px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                    >
                                        📂 Load Preset
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

                                        {/* Tease Pic Toggle */}
                                        <div style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '8px',
                                            padding: '12px',
                                            marginBottom: '16px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px'
                                        }}>
                                            <div
                                                style={{ position: 'relative', width: '40px', height: '60px' }}
                                                onMouseOver={e => e.currentTarget.children[0].style.transform = 'scale(1.05)'}
                                                onMouseOut={e => e.currentTarget.children[0].style.transform = 'scale(1)'}
                                            >
                                                <div
                                                    onClick={() => setTeasePreview(true)}
                                                    style={{
                                                        width: '100%', height: '100%',
                                                        background: '#1e1e1e',
                                                        borderRadius: '4px',
                                                        border: '1px solid #444',
                                                        overflow: 'hidden',
                                                        cursor: 'pointer',
                                                        backgroundImage: `url(/tease_thumb.jpg?v=${teaseThumbVersion})`,
                                                        backgroundSize: 'cover',
                                                        backgroundPosition: 'center',
                                                        transition: 'transform 0.2s'
                                                    }}
                                                >
                                                    <div style={{
                                                        fontSize: '6px',
                                                        color: 'rgba(255,255,255,0.7)',
                                                        textAlign: 'center',
                                                        position: 'absolute',
                                                        bottom: '0',
                                                        width: '100%',
                                                        background: 'rgba(0,0,0,0.6)',
                                                        padding: '2px 0'
                                                    }}>TEASE</div>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); teaseInputRef.current.click(); }}
                                                    style={{
                                                        position: 'absolute',
                                                        top: '-5px', right: '-5px',
                                                        width: '16px', height: '16px',
                                                        background: '#6366f1',
                                                        border: '1px solid white',
                                                        borderRadius: '50%',
                                                        color: 'white',
                                                        fontSize: '10px',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        zIndex: 2
                                                    }}
                                                    title="Upload Custom Image"
                                                >
                                                    ✎
                                                </button>
                                                <input
                                                    type="file"
                                                    ref={teaseInputRef}
                                                    style={{ display: 'none' }}
                                                    accept="image/*"
                                                    onChange={handleTeaseUpload}
                                                />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <label style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>Send Personalized Tease Pic</label>

                                                    <label className={styles.switch} style={{ marginLeft: '10px' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={sendTeasePic}
                                                            onChange={e => setSendTeasePic(e.target.checked)}
                                                        />
                                                        <span className={styles.slider}></span>
                                                    </label>
                                                </div>
                                                <small style={{ color: '#aaa', display: 'block', marginTop: '4px' }}>
                                                    Automatically send a generated photo holding a sign with their name, following the opener.
                                                </small>
                                            </div>
                                        </div>
                                        <textarea
                                            value={outreachMessage}
                                            onChange={e => setOutreachMessage(e.target.value)}
                                            placeholder="Hey {{name}}! Saw you in the {{group}} group..."
                                            style={{ width: '100%', height: '120px', padding: '10px', borderRadius: '8px', background: '#333', color: 'white', border: '1px solid #555', marginBottom: '16px' }}
                                        />

                                        <label>Example Chatflow (AI Guide)</label>
                                        <small style={{ color: '#888', marginTop: '4px', display: 'block', marginBottom: '12px' }}>
                                            Paste an example conversation to guide the AI's style and tone.
                                        </small>
                                        <textarea
                                            value={exampleChatflow}
                                            onChange={e => setExampleChatflow(e.target.value)}
                                            placeholder="Example:
Aria: Hey, I saw you in the group...
User: Hi!
Aria: You seem interesting... what's your vibe?"
                                            style={{ width: '100%', height: '150px', padding: '10px', borderRadius: '8px', background: '#333', color: 'white', border: '1px solid #555', marginBottom: '16px', fontFamily: 'monospace', fontSize: '13px' }}
                                        />


                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <label style={{ margin: 0 }}>Blast List (Usernames)</label>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {blastListMode === 'list' && (
                                                    <>
                                                        <button
                                                            onClick={handleSelectAllBlastItems}
                                                            style={{
                                                                background: 'none',
                                                                border: '1px solid #555',
                                                                color: '#aaa',
                                                                padding: '4px 8px',
                                                                borderRadius: '4px',
                                                                fontSize: '11px',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            {selectedBlastItems.size === getBlastListArray().length && getBlastListArray().length > 0 ? 'Deselect All' : 'Select All'}
                                                        </button>
                                                        <button
                                                            onClick={handleDeleteSelectedBlastItems}
                                                            disabled={selectedBlastItems.size === 0}
                                                            style={{
                                                                background: selectedBlastItems.size > 0 ? 'rgba(239, 68, 68, 0.2)' : 'none',
                                                                border: '1px solid ' + (selectedBlastItems.size > 0 ? '#ef4444' : '#333'),
                                                                color: selectedBlastItems.size > 0 ? '#ef4444' : '#444',
                                                                padding: '4px 8px',
                                                                borderRadius: '4px',
                                                                fontSize: '11px',
                                                                cursor: selectedBlastItems.size > 0 ? 'pointer' : 'not-allowed'
                                                            }}
                                                        >
                                                            Delete Selected ({selectedBlastItems.size})
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={handleToggleBlastMode}
                                                    style={{
                                                        background: 'none',
                                                        border: '1px solid var(--color-primary)',
                                                        color: 'var(--color-primary)',
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '11px',
                                                        cursor: 'pointer',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    {blastListMode === 'text' ? '📋 Switch to List View' : '📝 Switch to Text Input'}
                                                </button>
                                            </div>
                                        </div>

                                        {isSending ? (
                                            <div style={{
                                                width: '100%',
                                                height: '250px',
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
                                            <>
                                                {blastListMode === 'text' ? (
                                                    <textarea
                                                        value={usernames}
                                                        onChange={e => setUsernames(e.target.value)}
                                                        placeholder="@user1&#10;@user2"
                                                        style={{ width: '100%', height: '250px', padding: '10px', borderRadius: '8px', background: '#333', color: 'white', border: '1px solid #555', fontFamily: 'monospace', fontSize: '13px' }}
                                                    />
                                                ) : (
                                                    <div style={{
                                                        width: '100%',
                                                        height: '250px',
                                                        borderRadius: '8px',
                                                        background: '#333',
                                                        border: '1px solid #555',
                                                        overflowY: 'auto',
                                                        display: 'flex',
                                                        flexDirection: 'column'
                                                    }}>
                                                        {getBlastListArray().length === 0 ? (
                                                            <div style={{ padding: '20px', textAlign: 'center', opacity: 0.5, fontSize: '13px' }}>
                                                                List is empty. Switch to Text Input to paste usernames.
                                                            </div>
                                                        ) : (
                                                            getBlastListArray().map((u, idx) => (
                                                                <div key={idx} style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    padding: '8px 12px',
                                                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                                    background: selectedBlastItems.has(idx) ? 'rgba(99, 102, 241, 0.1)' : 'transparent'
                                                                }}>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedBlastItems.has(idx)}
                                                                        onChange={() => handleSelectBlastItem(idx)}
                                                                        style={{ marginRight: '12px', cursor: 'pointer' }}
                                                                    />
                                                                    <span style={{ flex: 1, fontFamily: 'monospace', fontSize: '13px' }}>{u}</span>
                                                                    <button
                                                                        onClick={() => handleDeleteBlastItem(idx)}
                                                                        style={{
                                                                            background: 'none',
                                                                            border: 'none',
                                                                            cursor: 'pointer',
                                                                            padding: '4px',
                                                                            opacity: 0.7,
                                                                            display: 'flex', alignItems: 'center'
                                                                        }}
                                                                        title="Delete item"
                                                                    >
                                                                        <TrashIcon />
                                                                    </button>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        <small style={{ color: '#888', marginTop: '4px', display: 'block' }}>
                                            {getBlastListArray().length} targets in queue.
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

                                    {/* Relocated Agent Control */}
                                    <div style={{ marginTop: '40px', paddingTop: '40px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <h3 style={{ margin: 0 }}>Agent Auto-Reply Control</h3>
                                                <div style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '20px',
                                                    background: botStatus === 'running' ? 'rgba(46, 213, 115, 0.2)' : 'rgba(255, 71, 87, 0.2)',
                                                    color: botStatus === 'running' ? '#2ed573' : '#ff4757',
                                                    fontWeight: 'bold',
                                                    fontSize: '12px'
                                                }}>
                                                    {(botStatus || 'stopped').toUpperCase()}
                                                </div>
                                            </div>
                                            <InfoTooltip text="The Agent Auto-Reply system automatically handles incoming DMs based on your AI configuration. Keep this running to ensure 24/7 engagement with your fans." />
                                        </div>

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
                                                opacity: loading ? 0.7 : 1,
                                                borderRadius: '8px'
                                            }}
                                        >
                                            {loading ? 'Processing...' : (botStatus === 'running' ? '🛑 STOP AGENT' : '🚀 START AGENT')}
                                        </button>

                                        <div style={{ marginTop: '20px', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', height: '150px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <h4 style={{ margin: '0 0 10px 0', color: '#888', fontSize: '11px', letterSpacing: '0.05em' }}>SYSTEM LOGS</h4>
                                            {logs.map((log, i) => (
                                                <div key={i} style={{ fontSize: '12px', fontFamily: 'monospace', color: '#aaa', marginBottom: '4px' }}>
                                                    {log}
                                                </div>
                                            ))}
                                            {logs.length === 0 && <div style={{ fontSize: '12px', color: '#555', fontStyle: 'italic' }}>Waiting for logs...</div>}
                                        </div>
                                    </div>
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
                    outreachMessage={outreachMessage}
                    exampleChatflow={exampleChatflow}
                    blastList={usernames}
                    onSave={() => { }}
                />

                <LoadConfigPresetModal
                    isOpen={isLoadPresetModalOpen}
                    onClose={() => setIsLoadPresetModalOpen(false)}
                    onPresetLoaded={handlePresetLoaded}
                />

                {/* Tease Pic Preview Modal */}
                {teasePreview && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.9)', zIndex: 9999,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexDirection: 'column',
                        animation: 'fadeIn 0.2s ease-in-out'
                    }} onClick={() => setTeasePreview(false)}>
                        <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
                            <img
                                src={`/tease_thumb.jpg?v=${teaseThumbVersion}`}
                                style={{
                                    maxWidth: '100%', maxHeight: '80vh',
                                    borderRadius: '8px',
                                    boxShadow: '0 0 30px rgba(0,0,0,0.8)',
                                    border: '1px solid #333'
                                }}
                                alt="Tease Pic Preview"
                            />
                            <button
                                onClick={(e) => { e.stopPropagation(); setTeasePreview(false); }}
                                style={{
                                    position: 'absolute', top: '-15px', right: '-15px',
                                    background: '#ef4444', border: '2px solid white',
                                    color: 'white',
                                    width: '30px', height: '30px', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '16px', cursor: 'pointer',
                                    boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
                                }}
                            >
                                ✕
                            </button>
                        </div>
                        <div style={{
                            color: '#888', marginTop: '15px',
                            fontFamily: 'monospace', fontSize: '12px',
                            background: 'rgba(0,0,0,0.5)', padding: '5px 10px', borderRadius: '20px'
                        }}>
                            Preview: Personalized Tease Pic (Click anywhere to close)
                        </div>
                    </div>
                )}
            </div >
        </>
    );
}

export default function AIConfig() {
    return (
        <Suspense fallback={
            <div style={{
                minHeight: '100vh',
                background: '#0a0a14',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
            }}>
                Loading AI Configuration...
            </div>
        }>
            <AIConfigContent />
        </Suspense>
    );
}
