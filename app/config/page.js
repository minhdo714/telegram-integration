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
    const [botType, setBotType] = useState(null);
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

    const DEFAULT_OUTREACH_MESSAGES = [
        "Hey {{name}}! I saw you in the {{group}} group and you seem like you actually have a brain in there 😅 How's your day going?",
        "{{name}}! I spotted you in the {{group}} group earlier. You always have the best timing with your comments 😄 What are you up to right now?",
        "Hi {{name}} 👋 I saw you in the {{group}} group and figured I'd reach out. You seem like someone worth knowing 😊 Hope you're having a good one!",
        "Heyyy {{name}}! Noticed you in the {{group}} group. The conversations in there are wild but you seem pretty normal 😂 How's your week treating you?",
        "{{name}}! I was scrolling through the {{group}} group and your name kept catching my eye 👀 You seem fun. Just wanted to say hi!",
        "Hiya {{name}}! Saw you in the {{group}} group and thought I'd introduce myself properly instead of just lurking in the shadows 👻 How's everything?",
        "Hey {{name}}! I saw you in the {{group}} group earlier. You had some really good points in there 💯 Just wanted to come say hello directly!",
        "{{name}}! I'm in the {{group}} group with you and noticed your messages always make me smile 😊 Figured I'd shoot you a message. Hope you're having a great day!",
        "Hey there {{name}}! I saw you in the {{group}} group and you seem really genuine ✨ That's rare to find in those big groups. How are you doing today?",
        "Well hello {{name}}! I spotted you in the {{group}} group and thought I'd take a chance and message you 🙈 You seem like good people. What's new?",
        "Hey {{name}}! I'm also in the {{group}} group and I keep seeing your name pop up 💬 You seem really active in there. Just wanted to say hi properly!",
        "{{name}}! 👋 I saw you in the {{group}} group earlier. The vibes in there are chaotic but you seem pretty chill 😎 How's your day going so far?",
        "Hey hey {{name}}! Noticed you in the {{group}} group. I usually just lurk but you caught my attention 👀 Hope you're having an amazing day!",
        "Hi {{name}}! I saw you in the {{group}} group and you seem really cool 😌 Thought I'd reach out and see how you're doing today!",
        "{{name}}! I'm in the {{group}} group with you and your messages always make me laugh 😂 Just wanted to send a quick hello your way!",
        "Hey {{name}}! I spotted you in the {{group}} group. You seem way more interesting than most people in there 🤔 What are you up to today?",
        "Hello {{name}}! Saw your name in the {{group}} group and decided to be brave and message you 🦋 You seem like someone worth knowing. How's everything?",
        "Heyyy {{name}}! I noticed you in the {{group}} group earlier. You had a really good take on something in there 👌 Just wanted to say hi!",
        "{{name}}! I saw you in the {{group}} group and you seem really down to earth 🌍 That's hard to find these days. How are you doing?",
        "Hi there {{name}}! I'm also in the {{group}} group and I've noticed you around 🌟 You seem like you have a good head on your shoulders. What's up?",
        "Hey {{name}}! I saw you in the {{group}} group and thought you looked familiar 👀 Then I realized I just see you in there all the time being awesome. How's your day?",
        "{{name}}! 👋 I was just in the {{group}} group and saw your name. Figured I'd come say hello instead of just watching from afar 🌸 Hope you're well!",
        "Hey hey {{name}}! Spotted you in the {{group}} group. You seem like the type of person who actually reads messages before replying 📖 Rare these days! How are you?",
        "Hi {{name}}! I saw you in the {{group}} group earlier. You had some good things to say 💭 Thought I'd introduce myself. Nice to meet you!",
        "{{name}}! I'm in the {{group}} group with you and I've noticed you're always so polite in there 🤍 Just wanted to send a message and say that's really nice to see. How's your day going?"
    ].join('\n');

    // Outreach State
    const [usernames, setUsernames] = useState('');
    const [blastListMode, setBlastListMode] = useState('text'); // 'text' | 'list'
    const [selectedBlastItems, setSelectedBlastItems] = useState(new Set());
    const [outreachMessage, setOutreachMessage] = useState(DEFAULT_OUTREACH_MESSAGES);
    const [exampleChatflow, setExampleChatflow] = useState(`OFCharmer: Hey, saw you in those late-night Telegram groups again... guys just chilling, venting about shitty days or feeling invisible. Kinda hits different when you're on the other side of it too, doesn't it? 😔
Jane: Omg yes. It's the same thing every night. I'm Jane, content ready, always down for live sex chats or PPV, but actually getting those quiet lurkers to pay? It's fucking exhausting. I sit there for hours scrolling, trying to figure out who might actually buy, and most just ghost or flake the second I bring up anything real. Leaves me drained and honestly? Feeling like I'm begging sometimes.
OFCharmer: Ugh I felt that in my bones. That exact burnout is why I built OFCharmer. It basically does the boring part for you—watches those groups, spots the guys who seem open (like the ones posting "another lonely night" or "work sucked today"), and slides into their DMs with short, real messages that don't scream "SELL." Stuff like:
OFCharmer: "Hey saw your comment... rough day? I'm unwinding too rn, same boat."
Jane: Wait that's actually... not cringe? Most outreach feels so thirsty.
OFCharmer: Right?? They reply way more 'cause it feels like another tired human in the group reaching out, not some bot or desperate spam. Then it keeps the chat flowing naturally—quick back and forth, no long paragraphs—and here's the part that changed everything for me: you upload your actual pics once as base, and when a guy says "can I see you in a nurse fit" or whatever weird kink they're into, the AI generates that exact image of YOU in seconds and sends it. Like... no editing, no stopping what you're doing, no "hold on let me make something." Just instant custom content that looks 100% like you. Guys go absolutely feral for it.
Jane: Wait so I don't have to pause my whole night every time someone asks for something specific?
OFCharmer: Exactly. It handles all that while you sleep, shower, film, scroll TikTok, whatever. No more hunting or chasing ghosts. More paid chats, more sales, way less of that soul-crushing feeling that you're working 24/7 for nothing. I actually get to enjoy making content again instead of dreading the hustle.
OFCharmer: Setup is stupid easy—connect your Telegram in like 10 mins, upload your real pics as base, pick your vibe (raw, sweet, bratty, whatever fits you), add your triggers, and it just... runs. While you exist.
OFCharmer: It's 11:50 PM here in the LA area, I'm finally in bed with the lights low, brain turning off. You in Garden Grove still up scrolling too?
OFCharmer: Real quick—what's actually draining you most right now? The hours of scrolling that lead nowhere, or guys acting interested then vanishing right when it's time to pay?
Jane: Probably the vanishing tbh. Gets my hopes up then nothing.
OFCharmer: Yeah that's the worst. Makes you feel crazy. This fixes that because it keeps them hooked with those instant custom pics—once they see themselves getting exactly what they asked for right away, they're way more likely to actually follow through on a live session or PPV.
OFCharmer: So... want to see how it actually feels? No card needed, no commitment. Just type START and it'll boot up the actual AI bot for you right here. You can play with it, see how it talks, how it sends pics—and if you wanna go deeper and customize everything, just head to https://ofcharmer.vercel.app/ and set your exact vibe. Takes two minutes.
OFCharmer: But for now.. just type START and meet your new 3 AM shift worker.`);
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
    const [joiningGroupId, setJoiningGroupId] = useState(null);
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
            // Only show "running" on this page if the active agent is engagement (or null/undefined for legacy)
            const isThisPageAgent = !data.type || data.type === 'engagement';
            setBotStatus(data.status === 'running' && isThisPageAgent ? 'running' : 'stopped');
            setPid(isThisPageAgent ? data.pid : null);
            setBotType(data.type);
        } catch (error) {
            console.error('Failed to check status:', error);
            setBotStatus('stopped');
        }
    };



    const fetchAssets = async (accountId) => {
        try {
            const res = await fetch(`/api/assets/config?accountId=${accountId}&context=engagement`);
            const data = await res.json();

            if (data.status === 'success' && data.assets) {
                const getProxyUrl = (relativePath) => relativePath ? `/api/uploads/${relativePath}` : null;

                setFaceRef(getProxyUrl(data.assets.model_face_ref));
                setRoomRef(getProxyUrl(data.assets.room_bg_ref));
                if (data.assets.outreach_message) {
                    setOutreachMessage(data.assets.outreach_message);
                } else {
                    setOutreachMessage(DEFAULT_OUTREACH_MESSAGES);
                }
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
                setOutreachMessage(DEFAULT_OUTREACH_MESSAGES);
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
        formData.append('context', 'engagement');

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
                    filename: cleanPath,
                    context: 'engagement'
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
        window.stopOutreachRequested = false;
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

                if (res.ok && data.status !== 'error') {
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

                    if (data.error_type === 'session_invalid' || data.error_type === 'connection_failed') {
                        addLog(`[Outreach] 🛑 Aborting blast due to critical error: ${data.message || data.error_type}`);
                        break;
                    }
                }
            } catch (err) {
                addLog(`[Outreach] ❌ Error @${recipient}: ${err.message}`);
                setFailedUsernames(prev => [...prev, recipient]);
            }

            // SAFETY: Delay logic (only if not the last message)
            if (i < targetList.length - 1) {
                // If stop was requested after sending, don't start the next delay
                if (window.stopOutreachRequested) break;

                const minDelay = 5 * 60;
                const maxDelay = 15 * 60;
                const delaySeconds = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

                addLog(`[Safety] Waiting ${Math.floor(delaySeconds / 60)}m ${delaySeconds % 60}s before next...`);

                let remaining = delaySeconds;
                setCountdown(remaining);

                while (remaining > 0) {
                    if (window.stopOutreachRequested) {
                        setCountdown(null);
                        break;
                    }
                    await new Promise(r => setTimeout(r, 1000));
                    remaining--;
                    setCountdown(remaining);
                }
                setCountdown(null);

                // If stopped during the wait, break the main loop
                if (window.stopOutreachRequested) break;
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
        setJoiningGroupId(username);
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
                setJoiningGroupId(null);
                handleScrapeGroup(username);
            } else {
                addLog(`❌ Join failed: ${data.message}`);
                setJoiningGroupId(null);
            }
        } catch (error) {
            addLog(`❌ Join error: ${error.message}`);
            setJoiningGroupId(null);
        }
    };

    const handleDeleteAllLeads = async () => {
        if (!confirm('Are you sure you want to delete ALL leads? This cannot be undone.')) return;
        try {
            const res = await fetch('/api/leads/delete-all', { method: 'DELETE' });
            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Raw response from delete-all:', text);
                toast.error('Server returned invalid data');
                return;
            }

            if (res.ok && data.status === 'success') {
                toast.success(`Deleted ${data.deleted_count} leads`);
                setSelectedLeadIds([]);
                fetchLeads();
            } else {
                toast.error(`Delete all failed: ${data.message || data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Delete all error:', error);
            toast.error('Delete all failed');
        }
    };

    const toggleBot = async () => {
        setLoading(true);

        if (botStatus === 'stopped') {
            // Check for conflict (Outreach running)
            try {
                const statusRes = await fetch('/api/bot/status');
                const statusData = await statusRes.json();

                if (statusData.status === 'running' && statusData.type === 'outreach') {
                    if (!confirm("The Outreach Agent is currently running. Would you like to stop it and start the Fan Engagement Agent instead?")) {
                        setLoading(false);
                        return;
                    }
                    // Stop the existing outreach bot
                    await fetch('/api/bot/stop', { method: 'POST' });
                    addLog('🛑 Stopped Outreach Agent to switch');
                }
            } catch (e) { console.error("Conflict check failed", e); }

            // AUTO-SAVE engagement config before starting so the bot can load it
            try {
                const userId = document.cookie.split('; ').find(row => row.startsWith('user_id='))?.split('=')[1] || '1';
                const saveRes = await fetch('/api/ai-configs/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId,
                        name: 'Active Engagement Config',
                        model_face_ref: faceRef?.replace('/api/uploads/', ''),
                        room_bg_ref: roomRef?.replace('/api/uploads/', ''),
                        opener_images: JSON.stringify(openers.map(p => p.replace('/api/uploads/', ''))),
                        outreach_message: outreachMessage,
                        example_chatflow: exampleChatflow,
                        blast_list: usernames
                    })
                });
                const saveData = await saveRes.json();
                if (saveData.status === 'success' && saveData.id) {
                    // Link it to the account
                    await fetch(`/api/accounts/${selectedAccountId}/assign-config`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ activeConfigId: saveData.id })
                    });
                    addLog('💾 Engagement config saved & linked to account');
                }
            } catch (saveErr) {
                console.error('Auto-save failed:', saveErr);
                addLog('⚠️ Could not auto-save config, bot may use defaults');
            }

            // Start Engagement Bot
            try {
                const res = await fetch('/api/bot/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'engagement' })
                });
                const data = await res.json();
                if (data.status === 'started' || data.status === 'already_running') {
                    setBotStatus('running');
                    setBotType('engagement');
                    setPid(data.pid);
                    addLog('✅ Engagement Agent started successfully');
                } else {
                    addLog(`❌ Error starting: ${data.message || 'Unknown error'}`);
                }
            } catch (error) {
                addLog(`❌ Network Error: ${error.message}`);
            }
        } else {
            // Stop Bot (Only if THIS one is running, or stop whatever is running)
            try {
                const res = await fetch('/api/bot/stop', { method: 'POST' });
                const data = await res.json();
                if (data.status === 'stopped' || data.status === 'not_running') {
                    setBotStatus('stopped');
                    setBotType(null);
                    setPid(null);
                    addLog('🛑 Agent stopped');
                }
            } catch (error) {
                addLog(`❌ Stop error: ${error.message}`);
            }
        }
        setLoading(false);
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
                    context: 'engagement',
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
                // Auto-trigger the "Save as Preset" modal to unify the workflow
                setTimeout(() => {
                    setIsSavePresetModalOpen(true);
                }, 500);
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
        if (preset.outreach_message) {
            setOutreachMessage(preset.outreach_message);
        } else {
            setOutreachMessage(DEFAULT_OUTREACH_MESSAGES);
        }
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
            const res = await fetch('/api/leads/bulk-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leadIds: selectedLeadIds })
            });
            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                toast.error('Invalid server response');
                return;
            }

            if (res.ok) {
                toast.success(`Deleted ${data.deleted_count} leads`);
                setSelectedLeadIds([]);
                fetchLeads();
            } else {
                toast.error(`Bulk delete failed: ${data.message || data.error}`);
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
            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                toast.error('Invalid server response');
                return;
            }

            if (res.ok && data.status === 'success') {
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
                                        onClick={handleSaveAssets}
                                        className="btn"
                                        style={{
                                            flex: 1,
                                            background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
                                            color: '#fff',
                                            border: 'none',
                                            padding: '12px 24px',
                                            fontSize: '14px',
                                            fontWeight: 'bold',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        💾 Save Configuration
                                    </button>
                                    <button
                                        className="btn"
                                        onClick={() => setIsLoadPresetModalOpen(true)}
                                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '14px', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}
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
                                                    style={{ fontSize: '12px', background: isSessionExpired ? '#444' : '#2ed573', minWidth: '100px' }}
                                                    onClick={() => !isSessionExpired && handleJoinAndScrape(group.username || group.id)}
                                                    disabled={isSessionExpired || joiningGroupId === (group.username || group.id) || scrapingGroupId === (group.username || group.id)}
                                                >
                                                    {isSessionExpired ? 'Session Expired' : (
                                                        joiningGroupId === (group.username || group.id) ? 'Joining...' : (
                                                            scrapingGroupId === (group.username || group.id) ? 'Scraping...' : 'Join & Scrape'
                                                        )
                                                    )}
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
                                            {selectedLeadIds.length > 0 && (
                                                <button
                                                    className="btn"
                                                    style={{ fontSize: '12px', background: '#ff4757', color: 'white' }}
                                                    onClick={handleBulkDeleteLeads}
                                                >
                                                    Delete Selected ({selectedLeadIds.length})
                                                </button>
                                            )}
                                            <button
                                                className="btn"
                                                style={{ fontSize: '12px', background: 'rgba(255, 71, 87, 0.1)', color: '#ff4757', border: '1px solid rgba(255, 71, 87, 0.2)' }}
                                                onClick={handleDeleteAllLeads}
                                            >
                                                Delete All
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
                                                    <th style={{ textAlign: 'right' }}>Actions</th>
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
                                                        <td style={{ textAlign: 'right' }}>
                                                            <button
                                                                onClick={() => handleDeleteLead(lead.id)}
                                                                style={{
                                                                    background: 'none',
                                                                    border: 'none',
                                                                    cursor: 'pointer',
                                                                    padding: '4px',
                                                                    opacity: 0.6
                                                                }}
                                                                title="Delete Lead"
                                                            >
                                                                <TrashIcon />
                                                            </button>
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
                                                    fontSize: '11px',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {botStatus === 'running' ? `RUNNING (${botType === 'outreach' ? 'Outreach' : 'Engagement'})` : 'STOPPED'}
                                                </div>
                                            </div>
                                            <InfoTooltip text="The Agent Auto-Reply system automatically handles incoming DMs based on your AI configuration. Keep this running to ensure 24/7 engagement with your fans." />
                                        </div>

                                        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                                            <button
                                                onClick={toggleBot}
                                                disabled={loading}
                                                className="btn"
                                                style={{
                                                    flex: 1,
                                                    background: botStatus === 'running' ? '#ff4757' : '#2ed573',
                                                    color: '#fff',
                                                    border: 'none',
                                                    padding: '16px',
                                                    fontSize: '16px',
                                                    fontWeight: 'bold',
                                                    cursor: loading ? 'wait' : 'pointer',
                                                    opacity: loading ? 0.7 : 1,
                                                    borderRadius: '8px'
                                                }}
                                            >
                                                {loading ? 'Processing...' : (
                                                    botStatus === 'running'
                                                        ? (botType === 'outreach' ? '🛑 STOP OUTREACH AGENT' : '🛑 STOP ENGAGEMENT AGENT')
                                                        : '🚀 START ENGAGEMENT AGENT'
                                                )}
                                            </button>
                                        </div>

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
