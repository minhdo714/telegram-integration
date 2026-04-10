'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';
import Navigation from '@/components/Navigation';
import AccountConnectionModal from '@/components/AccountConnectionModal';
import SaveConfigPresetModal from '@/components/SaveConfigPresetModal';
import LoadConfigPresetModal from '@/components/LoadConfigPresetModal';
import styles from '@/components/MessageComposer.module.css'; // Global container styles
import assetStyles from '../config/AIConfig.module.css'; // Reusing existing styles

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

        if (left + tooltipWidth > window.innerWidth - padding) {
            left = window.innerWidth - tooltipWidth - padding;
        }

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

const DEFAULT_PART1_OPENERS = [
    "Hi {{name}}! Saw you in the {{group}} and wondering have you been getting clients to your content or service.",
    "Hey {{name}}! Saw you in {{group}} and was wondering if you've been getting clients to your content or service.",
    "Hello {{name}}! I noticed you in the {{group}} and wondered: have you been getting clients for your content or service?",
    "Hi {{name}}! Spotted you in the {{group}} and wanted to ask if you've been getting clients to your content or service.",
    "Hey there {{name}}! Saw you active in the {{group}} and was wondering if you've been getting clients to your content or service.",
    "Hi {{name}} 👋 Saw you in {{group}} and wondering have you been getting clients to your content or service?",
    "{{name}}! Saw you in the {{group}} and was wondering, have you been getting clients to your content or service recently?",
    "Hey {{name}}, saw you in the {{group}} and wondering if you're getting clients to your content or service.",
    "Hi {{name}}! I saw you in the {{group}} and was just wondering if you've been getting clients to your content or service.",
    "Hello {{name}} 👋 Saw you in the {{group}} and wondering have you been getting clients to your content or service?",
    "Hey {{name}}! I ran across your name in {{group}}--wondering if you've been getting clients to your content or service.",
    "Hi {{name}}! Saw you in the {{group}} chat and wondering if you have been getting clients to your content or service.",
    "Hey {{name}}! I saw you in {{group}} and just wondering if you've been getting clients to your content or service, or no?",
    "Hi {{name}}! I spotted you in {{group}} and wondering have you been getting clients to your content or service?",
    "{{name}}! 👋 Saw you in the {{group}} and was wondering if you're getting clients to your content or service.",
    "Hey {{name}}! I was looking in the {{group}} and wondering: have you been getting clients to your content or service?",
    "Hi {{name}}! Saw you in {{group}} earlier and wondering have you been getting clients to your content or service.",
    "Hey {{name}}! I saw you in the {{group}} and was wondering... have you been getting clients to your content or service?",
    "Hello {{name}}! Noticed you in the {{group}} and wondering if you've been getting clients to your content or service.",
    "Hi {{name}}! Saw you over in {{group}} and wondering have you been getting clients to your content or service.",
    "Hey {{name}}! I noticed you in the {{group}} and wondering have you been getting clients to your content or service.",
    "Hi {{name}}! Saw you in {{group}} and wondering, have you been getting clients to your content or service?",
    "Hello {{name}}! I spotted your name in {{group}} and am wondering if you've been getting clients to your content or service.",
    "Hey {{name}}! Saw you in the {{group}} and was wondering if you have been getting clients to your content or service.",
    "Hi {{name}}! I saw you inside {{group}} and wondering have you been getting clients to your content or service.",
    "Hey {{name}}! I saw you in {{group}} and was wondering have you been getting clients to your content or service?",
    "Hi {{name}}! Saw you in the {{group}} and wondering if you've been getting clients to your content or service lately.",
    "{{name}}! I noticed you in {{group}} and wondering have you been getting clients to your content or service.",
    "Hey {{name}}! Saw your posts in {{group}} and wondering have you been getting clients to your content or service.",
    "Hi {{name}} 👋 I noticed you in the {{group}} and wondering have you been getting clients to your content or service.",
    "Hello {{name}}! Saw you in {{group}} and wondering if you have been getting clients to your content or service.",
    "Hey {{name}}! Spotted you in {{group}} and wondering have you been getting clients to your content or service.",
    "Hi {{name}}! Saw you in the {{group}} and wondering: have you been getting clients to your content or service?",
    "{{name}}! Saw you in the {{group}} and was wondering: have you been getting clients to your content or service?",
    "Hey {{name}}! I saw you in {{group}}... wondering have you been getting clients to your content or service.",
    "Hi {{name}}! Noticed you in the {{group}} and wondering have you been getting clients to your content or service.",
    "Hey {{name}}! I saw you in the {{group}} group and wondering have you been getting clients to your content or service.",
    "Hi {{name}}! Saw you in {{group}} and just wondering have you been getting clients to your content or service.",
    "Hello {{name}}! I saw you in the {{group}} and wondering whether you have been getting clients to your content or service.",
    "Hey {{name}}! Saw you in the {{group}} and wondering have you been getting any clients to your content or service.",
    "Hi {{name}}! I spotted you in the {{group}} and wondering have you been getting clients to your content or service.",
    "Hey {{name}}! Saw you around {{group}} and wondering have you been getting clients to your content or service.",
    "{{name}}! Saw you in the {{group}} and wondering have you been getting clients to your content or service.",
    "Hi {{name}}! I noticed your account in the {{group}} and wondering have you been getting clients to your content or service.",
    "Hey {{name}} 👋 Saw you in the {{group}} and wondering have you been getting clients to your content or service.",
    "Hi {{name}}! I saw you in the {{group}} and wondering if you are getting clients to your content or service.",
    "Hey {{name}}! Saw you active in {{group}} and wondering have you been getting clients to your content or service.",
    "Hello {{name}}! Saw you in the {{group}} and wondering have you been getting clients to your content or service.",
    "Hi {{name}}! Saw you in the {{group}} and wondering have you been getting clients to your content or service?",
    "Hey {{name}}! I saw you in the {{group}} and wondering have you been getting clients to your content or service."
].join('\n');

const DEFAULT_PART2_CHATFLOW = `OFCharmer: Hey, saw you in those late-night Telegram groups again... guys just chilling, venting about shitty days or feeling invisible. Kinda hits different when you're on the other side of it too, doesn't it? 😔
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
OFCharmer: But for now.. just type START and meet your new 3 AM shift worker.`;

const DEFAULT_PART3_CHATFLOW = `Jane: Hey! It's Jane from The Night Owls group. Hope you don't mind me DMing you. I just had to say that your comment in there was spot on, you seem like you have a great sense of humor. It's refreshing in such a chaotic group! 😄
John: Oh hey Jane! No worries at all. Haha, thanks, I try. The group can be a bit much sometimes. Welcome, by the way.
Jane: Thanks! And tell me about it. I joined thinking it was a quiet place to chat, but my notifications have been blowing up all morning. 😅 So, what's your story? Are you a full-time professional meme-lord, or do you have a day job? 😉
John: Haha, I wish. That's the dream, right? Nah, I'm just stuck in the office today, pretending to work while scrolling through here. You?
Jane: Oof, I feel your pain. Mondays, am I right? I'm actually just working from home today, which is nice. I do some modeling, so most of my work is shooting or promoting, which leaves a lot of downtime for chatting and, well, scrolling through memes. 😊
John: Modeling? That sounds way more interesting than spreadsheets. What kind of modeling?
Jane: A bit of everything, really! Fashion, lifestyle... I get to work with some really cool photographers. It's fun, but it can also be a lot of solo time. It's nice to just have a normal, funny chat with someone. So, what do you do when you're not conquering the corporate world?
John: Pretty standard stuff, honestly. Hit the gym when I can, try new restaurants, catch a game. Simple.
Jane: Love that. A guy who takes care of himself and has good taste in food? You're checking all the boxes, John. 😉 Speaking of good taste... I'm actually planning a shoot for later this week and I'm totally stuck on what to wear. I feel like guys always have the best opinion on this stuff. Can I get your take on something?
John: Uh, sure? I'm no fashion expert, but I can try.
Jane: Awesome! So, for a more casual, everyday look... what's a style you really like seeing a woman in? Like, are you more of a jeans-and-a-cute-top guy, or do you prefer something a little more sleek, like a dress? Just curious what the "male gaze" prefers, you know? 😉
John: Hmm, tough one. I mean, you can't go wrong with a nice, simple dress. Something effortless but looks good.
Jane: Great answer. 😍 That's actually super helpful. I have this one dress I was considering, it's really simple but my friend said it was "too much." Now I'm thinking she was wrong. Let me show you the one I'm talking about...
(Jane sends a photo. It's a tasteful but alluring picture of her in a form-fitting but not overly revealing dress.)
Jane: This is the one. Be honest... is this "too much" for a daytime shoot, or is it just right? 👗
John: Wow. Yeah, your friend is definitely wrong. That's... not too much at all. It's perfect.
Jane: 😊 Thank you! You just saved me from making a huge mistake. I really appreciate the honest opinion. You've got a great eye. Honestly, it's nice to get feedback from someone who isn't in the industry, you know? It feels more real.
John: Happy to help! Anytime.
Jane: 😏 "Anytime," huh? I might have to take you up on that. I have a whole folder of outfits I'm trying to decide on for different concepts. Some are a little more... bold. But it's hard to know which ones have that "wow" factor.
John: I'm intrigued. What do you mean by bold?
Jane: Well, the stuff for my paid pages, mostly. It's more artistic and intimate. The kind of content my biggest supporters get to see. Since you've been so helpful and fun to talk to... would you be interested in seeing a bit more? I could show you what I mean by "bold."
John: Yeah, I'd like that.
Jane: 😘 Great. I can send you a few previews, but to be fair to the guys who support me there, the really good stuff is on my private channel. It's super easy to get in, though. You can use Telegram Stars to unlock it. It's the best way to see the full-quality sets and videos. Want me to send you the link? It would be amazing to have you in there, you seem like you'd actually appreciate the art behind it. ✨`;

function OutreachConfigContent() {
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

    const [usernames, setUsernames] = useState('');
    const [blastListMode, setBlastListMode] = useState('text');
    const [selectedBlastItems, setSelectedBlastItems] = useState(new Set());
    const [outreachMessage, setOutreachMessage] = useState(DEFAULT_PART1_OPENERS);
    const [exampleChatflow, setExampleChatflow] = useState(DEFAULT_PART2_CHATFLOW);
    const [part3Chatflow, setPart3Chatflow] = useState(DEFAULT_PART3_CHATFLOW);

    const [sendTeasePic, setSendTeasePic] = useState(true);
    const [teasePreview, setTeasePreview] = useState(false);
    const [teaseThumbVersion, setTeaseThumbVersion] = useState(0);
    const teaseInputRef = useRef(null);
    const [isSending, setIsSending] = useState(false);
    const [stopRequested, setStopRequested] = useState(false);
    const [sentUsernames, setSentUsernames] = useState([]);
    const [failedUsernames, setFailedUsernames] = useState([]);
    const [currentTarget, setCurrentTarget] = useState(null);
    const [countdown, setCountdown] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

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

    useEffect(() => {
        let timer;
        if (countdown !== null && countdown > 0) {
            timer = setInterval(() => {
                setCountdown(prev => (prev > 0 ? prev - 1 : 0));
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [countdown]);

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
        } else {
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
                if (!selectedAccountId && data.accounts.length > 0) {
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
            // Only show "running" on this page if the active agent is outreach
            const isThisPageAgent = data.type === 'outreach';
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
            const res = await fetch(`/api/assets/config?accountId=${accountId}&context=outreach`);
            const data = await res.json();

            if (data.status === 'success' && data.assets) {
                // getProxyUrl: if the stored path is already a full URL (GitHub CDN), use it directly.
                const getProxyUrl = (path) => {
                    if (!path) return null;
                    if (path.startsWith('http://') || path.startsWith('https://')) return path;
                    if (path.startsWith('/api/assets/image/') || path.startsWith('/api/uploads/')) return path;
                    return `/api/uploads/${path}`;
                };
                setFaceRef(getProxyUrl(data.assets.model_face_ref));
                setRoomRef(getProxyUrl(data.assets.room_bg_ref));
                if (data.assets.outreach_message) setOutreachMessage(data.assets.outreach_message);
                if (data.assets.example_chatflow) setExampleChatflow(data.assets.example_chatflow);
                if (data.assets.part3_chatflow) setPart3Chatflow(data.assets.part3_chatflow);
                if (data.assets.opener_images) {
                    try {
                        const parsed = JSON.parse(data.assets.opener_images);
                        setOpeners(parsed.map(p => getProxyUrl(p)));
                    } catch (e) { setOpeners([]); }
                } else { setOpeners([]); }
                if (data.assets.blast_list) setUsernames(data.assets.blast_list);
            } else {
                // CLEAR UI if no assets are found (Strict Isolation)
                setFaceRef(null);
                setRoomRef(null);
                setOpeners([]);
                setOutreachMessage(DEFAULT_PART1_OPENERS);
                setExampleChatflow(DEFAULT_PART2_CHATFLOW);
                setPart3Chatflow(DEFAULT_PART3_CHATFLOW);
                setUsernames('');
            }
        } catch (error) {
            console.error('Failed to fetch assets:', error);
        }
    };

    const handleUpload = async (type, file) => {
        if (!selectedAccountId) return alert('Please select an account first!');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('accountId', selectedAccountId);
        formData.append('type', type);
        formData.append('context', 'outreach');

        try {
            const res = await fetch('/api/assets/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.status === 'success') {
                // data.path is either a full GitHub URL or a local relative path
                const proxyUrl = (data.path && (data.path.startsWith('http://') || data.path.startsWith('https://'))
                    ? data.path
                    : `/api/uploads/${data.path}`);
                if (type === 'face') setFaceRef(proxyUrl);
                if (type === 'room') setRoomRef(proxyUrl);
                if (type === 'opener') setOpeners(prev => [...prev, proxyUrl]);
                addLog(`✅ Uploaded ${type}: ${file.name}`);
            } else {
                addLog(`❌ Upload failed: ${data.message || data.error}`);
            }
        } catch (error) { addLog(`❌ Upload Error: ${error.message}`); }
    };

    const handleSaveAssets = async () => {
        if (!selectedAccountId) {
            toast.error('Please select an account first!');
            return;
        }

        try {
            const userId = document.cookie.split('; ').find(row => row.startsWith('user_id='))?.split('=')[1] || '1';
            const res = await fetch('/api/outreach-configs/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    accountId: selectedAccountId,
                    name: 'Manual Update',
                    model_face_ref: faceRef?.replace('/api/uploads/', ''),
                    room_bg_ref: roomRef?.replace('/api/uploads/', ''),
                    opener_images: JSON.stringify(openers.map(p => p.replace('/api/uploads/', ''))),
                    outreach_message: outreachMessage,
                    example_chatflow: exampleChatflow,
                    part3_chatflow: part3Chatflow,
                    blast_list: usernames
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                toast.success('Outreach Configuration saved!');
                setTimeout(() => setIsSavePresetModalOpen(true), 500);
            } else {
                toast.error(data.error || 'Failed to save');
            }
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Network error during save');
        }
    };

    const handlePresetLoaded = (preset) => {
        // getProxyUrl: if the stored path is already a full URL (GitHub CDN), use it directly.
        const getProxyUrl = (path) => {
            if (!path) return null;
            if (path.startsWith('http://') || path.startsWith('https://')) return path;
            return `/api/uploads/${path}`;
        };
        if (preset.model_face_ref) setFaceRef(getProxyUrl(preset.model_face_ref));
        if (preset.room_bg_ref) setRoomRef(getProxyUrl(preset.room_bg_ref));
        if (preset.outreach_message) setOutreachMessage(preset.outreach_message);
        if (preset.example_chatflow) setExampleChatflow(preset.example_chatflow);
        if (preset.part3_chatflow) setPart3Chatflow(preset.part3_chatflow);
        if (preset.blast_list) setUsernames(preset.blast_list);
        if (preset.opener_images) {
            try {
                const parsed = JSON.parse(preset.opener_images);
                setOpeners(parsed.map(p => getProxyUrl(p)));
            } catch (e) { setOpeners([]); }
        }
    };

    const handleGroupSearch = async () => {
        if (!selectedAccountId || !searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const res = await fetch(`/api/groups/search?accountId=${selectedAccountId}&q=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();
            if (data.status === 'success') setSearchResults(data.groups || []);
        } catch (error) { addLog(`❌ Search error: ${error.message}`); }
        finally { setIsSearching(false); }
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
                fetchLeads();
            }
        } catch (error) { addLog(`❌ Scrape error: ${error.message}`); }
        finally { setScrapingGroupId(null); }
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

    const fetchLeads = async () => {
        try {
            const res = await fetch('/api/leads/list');
            const data = await res.json();
            if (data.status === 'success') {
                setScrapedLeads(data.leads || []);
            }
        } catch (error) { console.error('Failed to fetch leads', error); }
    };

    const fetchMyGroups = async (accountId) => {
        try {
            const res = await fetch(`/api/groups/my?accountId=${accountId}`);
            const data = await res.json();
            if (data.status === 'success') setMyGroups(data.groups || []);
        } catch (error) { console.error('Failed to fetch my groups', error); }
    };

    const handleDeleteLead = async (lead_id) => {
        if (!confirm('Are you sure you want to delete this lead?')) return;
        try {
            const res = await fetch(`/api/leads/${lead_id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Lead deleted');
                fetchLeads();
            }
        } catch (error) { toast.error('Delete failed'); }
    };

    const toggleLeadSelection = (leadId) => {
        setSelectedLeadIds(prev =>
            prev.includes(leadId) ? prev.filter(id => id !== leadId) : [...prev, leadId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedLeadIds.length === scrapedLeads.length) {
            setSelectedLeadIds([]);
        } else {
            setSelectedLeadIds(scrapedLeads.map(l => l.id));
        }
    };

    const toggleBot = async () => {
        setLoading(true);

        if (botStatus === 'stopped') {
            // Check for conflict (Engagement running)
            try {
                const statusRes = await fetch('/api/bot/status');
                const statusData = await statusRes.json();

                if (statusData.status === 'running' && statusData.type === 'engagement') {
                    if (!confirm("The Fan Engagement Agent is currently running. Would you like to stop it and start the Outreach Agent instead?")) {
                        setLoading(false);
                        return;
                    }
                    // Stop the existing engagement bot
                    await fetch('/api/bot/stop', { method: 'POST' });
                    addLog('🛑 Stopped Engagement Agent to switch');
                }
            } catch (e) { console.error("Conflict check failed", e); }

            // AUTO-SAVE outreach config before starting so the bot can load it
            try {
                const userId = document.cookie.split('; ').find(row => row.startsWith('user_id='))?.split('=')[1] || '1';
                const saveRes = await fetch('/api/outreach-configs/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId,
                        accountId: selectedAccountId,
                        name: 'Active Outreach Config',
                        model_face_ref: faceRef?.replace('/api/uploads/', ''),
                        room_bg_ref: roomRef?.replace('/api/uploads/', ''),
                        opener_images: JSON.stringify(openers.map(p => p.replace('/api/uploads/', ''))),
                        outreach_message: outreachMessage,
                        example_chatflow: exampleChatflow,
                        part3_chatflow: part3Chatflow,
                        blast_list: usernames
                    })
                });
                const saveData = await saveRes.json();
                if (saveData.status === 'success') {
                    addLog('💾 Outreach config saved & linked to account');
                } else {
                    addLog(`⚠️ Config save warning: ${saveData.error || 'Unknown'}`);
                }
            } catch (saveErr) {
                console.error('Auto-save failed:', saveErr);
                addLog('⚠️ Could not auto-save config, bot may use defaults');
            }

            // Start Outreach Bot
            try {
                const res = await fetch('/api/bot/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'outreach' })
                });
                const data = await res.json();
                if (data.status === 'started' || data.status === 'already_running') {
                    setBotStatus('running');
                    setBotType('outreach');
                    setPid(data.pid);
                    addLog('✅ Outreach Agent started successfully');
                } else {
                    addLog(`❌ Error starting: ${data.message || 'Unknown error'}`);
                }
            } catch (error) {
                addLog(`❌ Network Error: ${error.message}`);
            }
        } else {
            // Stop Bot
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
            // Check if stop was requested - using a ref or checking state might be tricky in a loop
            // but we'll use a local check if possible or just assume sequential for now
            // In config/page.js it used a state 'stopRequested'.
            // However, state updates won't be visible inside the same loop iteration without special handling.
            // But React state updates in the next render cycle. 
            // For simplicity and consistency with the other page:

            if (window.stopOutreachRequested) {
                addLog('[Outreach] 🛑 Blast stopped by user.');
                window.stopOutreachRequested = false;
                break;
            }

            const user = targetList[i];
            const recipient = user.replace('@', '');
            setCurrentTarget(recipient);

            addLog(`[Outreach] Sending to @${recipient} (${i + 1}/${targetList.length})...`);

            try {
                const leadData = scrapedLeads.find(l => l.username?.toLowerCase() === recipient.toLowerCase());
                const groupName = leadData?.group_name || '';
                const firstName = leadData?.first_name || '';
                const displayName = firstName.trim() || `@${recipient}`;

                const variations = (outreachMessage || "").split('\n').filter(v => v.trim());
                let msgTemplate = variations.length > 0
                    ? variations[Math.floor(Math.random() * variations.length)]
                    : "Hey {{name}}! Found you through the {{group}} group, wanted to say hi";

                let msgToSend = msgTemplate;
                if (groupName) {
                    msgToSend = msgToSend.replace(/\{\{group\}\}/g, groupName);
                } else {
                    msgToSend = msgToSend.replace(/\s*(through the|from|in|via)\s+\{\{group\}\}\s*(group)?/gi, '');
                    msgToSend = msgToSend.replace(/\{\{group\}\}/g, 'the group');
                }
                msgToSend = msgToSend.replace(/\{\{name\}\}/g, displayName);

                const res = await fetch('/api/messages/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ accountId: selectedAccountId, recipient, message: msgToSend, sendOpenerImage: true })
                });

                const data = await res.json();

                if (res.ok && data.status !== 'error') {
                    addLog(`[Outreach] ✅ Sent to @${recipient}`);
                    setSentUsernames(prev => [...prev, recipient]);

                    // Tease pic logic if enabled
                    if (sendTeasePic) {
                        const leadData = scrapedLeads.find(l => l.username?.toLowerCase() === recipient.toLowerCase());
                        const firstName = leadData?.first_name || '';
                        const groupName = leadData?.group_name || '';
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
                                    addLog(`[Outreach] 📸 Tease pic generation started for @${recipient}`);
                                } else {
                                    addLog(`[Outreach] ⚠️ Tease pic error: ${teaseData.error}`);
                                }
                            }).catch(e => console.error('Tease fail:', e));
                    }
                } else {
                    addLog(`[Outreach] ❌ Failed @${recipient}: ${data.message || data.error || 'Unknown error'}`);
                    setFailedUsernames(prev => [...prev, recipient]);

                    if (data.error_type === 'session_invalid' || data.error_type === 'connection_failed') {
                        addLog(`[Outreach] 🛑 Aborting blast due to critical error: ${data.message || data.error_type}`);
                        break;
                    }
                }
            } catch (error) {
                addLog(`[Outreach] ❌ Error for @${recipient}: ${error.message}`);
                setFailedUsernames(prev => [...prev, recipient]);
            }

            // Delay between messages (1-2 mins)
            if (i < targetList.length - 1) {
                if (window.stopOutreachRequested) break;

                const waitSecs = Math.floor(Math.random() * (120 - 60 + 1)) + 60;
                addLog(`[Outreach] ⏳ Waiting ${waitSecs}s before next...`);

                let remaining = waitSecs;
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
        setCurrentTarget(null);
        addLog('[Outreach] ✨ Blast cycle complete.');
    };

    const handleStopOutreach = () => {
        window.stopOutreachRequested = true;
        setStopRequested(true);
        addLog('[Outreach] ⏳ Stopping after current message...');
    };

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

    const TrashIcon = () => (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="white" stroke="white" strokeWidth="1">
            <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );

    const deleteAsset = async (type, assetPath) => {
        if (!selectedAccountId) return;
        if (!confirm('Are you sure you want to delete this asset?')) return;

        try {
            const cleanPath = assetPath.replace('/api/uploads/', '');
            const res = await fetch('/api/assets/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    account_id: selectedAccountId,
                    type,
                    filename: cleanPath,
                    context: 'outreach'
                })
            });

            if (res.ok) {
                if (type === 'face') setFaceRef(null);
                if (type === 'opener') setOpeners(prev => prev.filter(p => p !== assetPath));
                toast.success('Asset deleted');
            } else {
                const err = await res.json();
                toast.error('Delete failed: ' + err.error);
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Error deleting asset');
        }
    };

    return (
        <>
            <Navigation />
            <Toaster position="top-right" />
            <div className="page" style={{ paddingTop: '80px', paddingBottom: '40px' }}>
                <div className="container">
                    <h1 className="title">My Ai Configuration Outreach</h1>
                    <p className="subtitle">Independent configuration for model outreach and webapp promotion</p>

                    <div className={assetStyles.configGrid}>
                        {/* Bot Identity & Assets Section */}
                        <div className={styles.modal} style={{ margin: 0, width: '100%', maxWidth: 'none', background: 'rgba(255,255,255,0.03)' }}>
                            <div className={styles.header}>
                                <h2>Outreach Bot Identity & Assets</h2>
                            </div>
                            <div className={styles.form}>
                                <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                                    <button onClick={handleSaveAssets} className="btn" style={{ flex: 1, background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', color: '#fff', border: 'none', padding: '12px', fontWeight: 'bold', borderRadius: '8px' }}>
                                        💾 Save Configuration
                                    </button>
                                    <button onClick={() => setIsLoadPresetModalOpen(true)} className="btn" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '12px', flex: 1 }}>
                                        📂 Load Preset
                                    </button>
                                </div>

                                <div className={styles.field}>
                                    <label>Select Outreach Bot</label>
                                    <select className={assetStyles.accountSelector} value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)}>
                                        <option value="">-- Choose Account --</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.firstName || acc.telegramUsername || acc.phoneNumber}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className={styles.field}>
                                    <label>Model Face Reference</label>
                                    <div className={assetStyles.uploadZone}>
                                        <input type="file" accept="image/*" style={{ display: 'none' }} id="face-upload" onChange={(e) => e.target.files[0] && handleUpload('face', e.target.files[0])} />
                                        {faceRef ? (
                                            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                                <label htmlFor="face-upload" style={{ cursor: 'pointer', display: 'block', width: '100%', height: '100%' }} title="Click to Replace">
                                                    <img src={faceRef} className={assetStyles.previewImage} alt="Face Ref" />
                                                </label>
                                                <button onClick={() => deleteAsset('face', faceRef)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', padding: '4px', cursor: 'pointer', zIndex: 10 }}><TrashIcon /></button>
                                            </div>
                                        ) : (
                                            <label htmlFor="face-upload" style={{ cursor: 'pointer', textAlign: 'center' }}>📸<br />Click to upload Face</label>
                                        )}
                                    </div>
                                </div>

                                <div className={styles.field}>
                                    <label>Opener Images</label>
                                    <div className={assetStyles.openerGrid}>
                                        {openers.map((src, i) => (
                                            <div key={i} className={assetStyles.openerItem}>
                                                <img src={src} alt="Opener" />
                                                <button className={assetStyles.deleteBtn} onClick={() => deleteAsset('opener', src)}>✕</button>
                                            </div>
                                        ))}
                                        <div className={assetStyles.uploadZone} style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <input type="file" style={{ display: 'none' }} id="opener-upload" onChange={(e) => e.target.files[0] && handleUpload('opener', e.target.files[0])} />
                                            <label htmlFor="opener-upload" style={{ cursor: 'pointer' }}>+</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* DISCOVERY & OUTREACH SECTION */}
                        <div className={styles.modal} style={{ margin: 0, width: '100%', maxWidth: 'none', background: 'rgba(255,255,255,0.03)', gridColumn: '1 / -1' }}>
                            <div className={styles.header}>
                                <h2>Lead Discovery & Outreach</h2>
                            </div>

                            <div className={styles.form} style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '40px' }}>

                                {/* 1. Find New Prospects */}
                                <div className={assetStyles.discoveryPanel}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                        <h3 style={{ margin: 0 }}>Find New Prospects</h3>
                                        <InfoTooltip text="Search for groups in your niche and scrape their members to find new model leads." />
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
                                        <button className="btn btn-primary" onClick={handleGroupSearch} disabled={isSearching}>
                                            {isSearching ? 'Searching...' : 'Search'}
                                        </button>
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
                                                    style={{ background: '#2ed573' }}
                                                    onClick={() => handleJoinAndScrape(group.username || group.id)}
                                                    disabled={joiningGroupId === (group.username || group.id) || scrapingGroupId === (group.username || group.id)}
                                                >
                                                    {joiningGroupId === (group.username || group.id) ? 'Joining...' : (scrapingGroupId === (group.username || group.id) ? 'Scraping...' : 'Join & Scrape')}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', margin: 0 }} />

                                {/* 2. Scan My Groups */}
                                <div className={assetStyles.discoveryPanel}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                        <h3 style={{ margin: 0 }}>Scan My Groups</h3>
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
                                                    disabled={scrapingGroupId === group.id}
                                                >
                                                    {scrapingGroupId === group.id ? 'Scraping...' : 'Scrape'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', margin: 0 }} />

                                {/* 3. Prospect Database */}
                                <div className={assetStyles.discoveryPanel}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                        <h3 style={{ margin: 0 }}>Prospect Database ({scrapedLeads.length})</h3>
                                        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                                            <button className="btn" style={{ fontSize: '12px' }} onClick={fetchLeads}>Refresh</button>
                                            <button className="btn" style={{ fontSize: '12px' }} onClick={toggleSelectAll}>Select All</button>
                                            <button className="btn btn-primary" style={{ fontSize: '12px' }} onClick={() => {
                                                const selected = scrapedLeads.filter(l => selectedLeadIds.includes(l.id) && l.username);
                                                if (selected.length === 0) return alert('Select prospects with usernames');
                                                setUsernames(selected.map(l => `@${l.username}`).join('\n'));
                                            }}>Sync to Outreach</button>
                                        </div>
                                    </div>
                                    <div className={assetStyles.leadTableContainer}>
                                        <table className={assetStyles.leadTable}>
                                            <thead>
                                                <tr>
                                                    <th style={{ width: '40px' }}><input type="checkbox" onChange={toggleSelectAll} checked={selectedLeadIds.length === scrapedLeads.length && scrapedLeads.length > 0} /></th>
                                                    <th>Name</th>
                                                    <th>Username</th>
                                                    <th>Group</th>
                                                    <th>Status</th>
                                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {scrapedLeads.map(lead => (
                                                    <tr key={lead.id}>
                                                        <td><input type="checkbox" checked={selectedLeadIds.includes(lead.id)} onChange={() => toggleLeadSelection(lead.id)} /></td>
                                                        <td>{lead.first_name} {lead.last_name}</td>
                                                        <td style={{ color: 'var(--color-primary)' }}>@{lead.username || 'N/A'}</td>
                                                        <td>{lead.group_name}</td>
                                                        <td><span className={`${assetStyles.statusBadge} ${assetStyles[lead.status]}`}>{lead.status.toUpperCase()}</span></td>
                                                        <td style={{ textAlign: 'right' }}>
                                                            <button onClick={() => handleDeleteLead(lead.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><TrashIcon /></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', margin: 0 }} />

                                {/* 4. Smart Outreach Campaign Settings */}
                                <div className={assetStyles.discoveryPanel}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                        <h3 style={{ margin: 0 }}>Smart Outreach Campaign</h3>
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
                                    <div className={styles.field} style={{ marginBottom: '24px' }}>
                                        <label style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>Outreach Opener / Vibe</label>
                                        <p style={{ fontSize: '13px', color: '#ccc', margin: '4px 0 8px' }}>
                                            Use <strong>{"{{group}}"}</strong> for group name and <strong>{"{{name}}"}</strong> for lead name.
                                        </p>
                                        <p style={{ fontSize: '12px', color: '#888', fontStyle: 'italic', marginBottom: '8px' }}>
                                            Pro Tip: Enter multiple lines to randomize the opener for each person!
                                        </p>
                                        <textarea
                                            value={outreachMessage}
                                            onChange={e => setOutreachMessage(e.target.value)}
                                            style={{ width: '100%', height: '140px', padding: '12px', borderRadius: '8px', background: '#1a1a1f', color: '#eee', border: '1px solid #333' }}
                                        />
                                    </div>
                                    <div className={styles.field} style={{ marginBottom: '24px' }}>
                                        <label style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>Part #2: Promotion Logic (Selling Webapp)</label>
                                        <p style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
                                            Webapp that is self-serve & does 3 major things:<br />
                                            1) Generates custom pics on demand from just one photo.<br />
                                            2) Learns your exact chatting style from sample conversations.<br />
                                            3) Finds prospects in your niche on Telegram and auto-messages them.
                                        </p>
                                        <textarea
                                            value={exampleChatflow}
                                            onChange={e => setExampleChatflow(e.target.value)}
                                            style={{ width: '100%', height: '180px', padding: '12px', borderRadius: '8px', background: '#1a1a1f', color: '#eee', border: '1px solid #333', fontFamily: 'monospace' }}
                                        />
                                    </div>
                                    <div className={styles.field} style={{ marginBottom: '24px' }}>
                                        <label style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>Part #3: Model Imitation Logic (Imitating Model via Webapp)</label>
                                        <p style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>Triggered when they type "START" (or mis-spellings like starr, sart). Imitates a model using the app to get customers.</p>
                                        <textarea
                                            value={part3Chatflow}
                                            onChange={e => setPart3Chatflow(e.target.value)}
                                            style={{ width: '100%', height: '180px', padding: '12px', borderRadius: '8px', background: '#1a1a1f', color: '#eee', border: '1px solid #333', fontFamily: 'monospace' }}
                                        />
                                    </div>
                                    {/* Send Personalized Tease Pic */}
                                    <div style={{
                                        background: 'rgba(99, 102, 241, 0.08)',
                                        border: '1px solid rgba(99, 102, 241, 0.2)',
                                        borderRadius: '8px',
                                        padding: '16px',
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

                                    <div className={styles.field} style={{ marginBottom: '16px' }}>
                                        <label>Blast List (Usernames)</label>
                                        <textarea
                                            value={usernames}
                                            onChange={e => setUsernames(e.target.value)}
                                            placeholder="@user1&#10;@user2"
                                            style={{ width: '100%', height: '150px', padding: '10px', borderRadius: '8px', background: '#333', color: 'white', border: '1px solid #555', fontFamily: 'monospace' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '16px', marginBottom: '16px' }}>
                                        <button
                                            onClick={toggleBot}
                                            disabled={loading || !selectedAccountId}
                                            className="btn"
                                            style={{
                                                flex: 1,
                                                background: botStatus === 'running' ? '#ff4757' : '#2ed573',
                                                color: '#fff',
                                                border: 'none',
                                                padding: '16px',
                                                fontSize: '16px',
                                                fontWeight: 'bold',
                                                cursor: (loading || !selectedAccountId) ? 'wait' : 'pointer',
                                                opacity: (loading || !selectedAccountId) ? 0.7 : 1,
                                                borderRadius: '8px',
                                                transition: 'all 0.3s'
                                            }}
                                        >
                                            {loading ? 'Processing...' : (
                                                botStatus === 'running'
                                                    ? (botType === 'engagement' ? '🛑 STOP ENGAGEMENT AGENT' : '🛑 STOP OUTREACH AGENT')
                                                    : '🚀 START OUTREACH AGENT'
                                            )}
                                        </button>
                                    </div>

                                    <button
                                        onClick={isSending ? handleStopOutreach : handleStartOutreach}
                                        disabled={!selectedAccountId}
                                        className="btn btn-primary"
                                        style={{
                                            width: '100%',
                                            background: isSending ? '#ef4444' : '#6366f1',
                                            padding: '16px',
                                            fontWeight: 'bold',
                                            transition: 'all 0.3s'
                                        }}
                                    >
                                        {isSending ? `Stop Outreach (Wait ${countdown || 0}s) 🛑` : 'Start Outreach Blast 🚀'}
                                    </button>
                                </div>

                                {/* Logs Section */}
                                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', height: '150px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <h4 style={{ margin: '0 0 10px 0', color: '#888', fontSize: '11px' }}>SYSTEM LOGS</h4>
                                    {logs.map((log, i) => (
                                        <div key={i} style={{ fontSize: '12px', fontFamily: 'monospace', color: '#aaa', marginBottom: '4px' }}>
                                            {log}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <SaveConfigPresetModal
                    isOpen={isSavePresetModalOpen}
                    onClose={() => setIsSavePresetModalOpen(false)}
                    currentAssets={{ faceRef, roomRef, openers }}
                    outreachMessage={outreachMessage}
                    exampleChatflow={exampleChatflow}
                    part3Chatflow={part3Chatflow}
                    blastList={usernames}
                    onSave={() => { }}
                    context="outreach"
                />

                <LoadConfigPresetModal
                    isOpen={isLoadPresetModalOpen}
                    onClose={() => setIsLoadPresetModalOpen(false)}
                    onPresetLoaded={handlePresetLoaded}
                    context="outreach"
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
            </div>
        </>
    );
}

export default function OutreachConfig() {
    return (
        <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0a0a14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>Loading Outreach Configuration...</div>}>
            <OutreachConfigContent />
        </Suspense>
    );
}
