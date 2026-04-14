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
    "Hey {{name}}, saw you in the {{group}} group. Have you been getting decent customers for your content and live chats lately?",
    "Hey {{name}}, noticed you active in {{group}}. Mind if I ask — are you getting good customers coming through for your OnlyFans & live chat?",
    "Hi {{name}}, saw you posting in {{group}} and got curious. How's the customer flow been for your content and live sessions?",
    "Hey {{name}}, I saw you in {{group}} earlier. Been getting any decent paying customers for your stuff and live chats?",
    "Hey {{name}}, spotted you in the {{group}} group. Quick question — are you pulling in good customers for your content/live chat?",
    "Hi {{name}}, saw your posts in {{group}}. How's business been? Getting many customers for your OnlyFans & live chat?",
    "Hey {{name}}, noticed you in {{group}}. Are you getting consistent customers coming in for your content and private shows?",
    "Hey {{name}}, I came across you in the {{group}} group. Have you been getting good traction with customers for your live chat?",
    "Hi {{name}}, saw you around in {{group}}. Just wondering if customers have been coming through for your content lately?",
    "Hey {{name}}, spotted your activity in {{group}}. How's the customer side going for your OnlyFans & live sessions?",
    "Hey {{name}}, saw you in {{group}} and thought I'd say hi. Are you getting decent customers for your content and live chats?",
    "Hi {{name}}, noticed you in the {{group}} group. Quick one — how's customer flow been for your live chat and content?",
    "Hey {{name}}, I saw you posting in {{group}}. Been getting many real customers for your OnlyFans & live service?",
    "Hey {{name}}, saw you active in {{group}}. Mind if I ask how customers are coming in for your content/live chats?",
    "Hi {{name}}, caught you in the {{group}} group. How's it going with getting paying customers for your live sessions?",
    "Hey {{name}}, noticed your posts in {{group}}. Are you pulling in steady customers for your OnlyFans & live chat?",
    "Hey {{name}}, saw you in {{group}} today. Just curious — how's the customer situation for your content been?",
    "Hi {{name}}, I saw you hanging in {{group}}. Have you been getting good customers for your live chat service?",
    "Hey {{name}}, spotted you in the {{group}} group. How's business with customers for your content and private shows?",
    "Hey {{name}}, saw your activity in {{group}}. Are customers coming through okay for your OnlyFans & live chats?",
    "Hi {{name}}, noticed you in {{group}}. Quick question — you getting decent customers for your live sessions lately?",
    "Hey {{name}}, I came across you in {{group}}. How's the flow of paying customers been for your content?",
    "Hey {{name}}, saw you posting in the {{group}} group. Been getting good traction with customers on your live chat?",
    "Hi {{name}}, spotted you in {{group}}. Just wondering if customers have been consistent for your OnlyFans & live service?",
    "Hey {{name}}, noticed you active in {{group}}. How are things going with getting customers for your content?",
    "Hey {{name}}, saw you in the {{group}} group earlier. Are you pulling in real customers for your live chats?",
    "Hi {{name}}, I saw your posts in {{group}}. Mind if I ask how customer acquisition has been for your live sessions?",
    "Hey {{name}}, caught you in {{group}}. How's the customer side treating you for your OnlyFans & live chat?",
    "Hey {{name}}, saw you around in the {{group}} group. You getting decent paying fans for your content lately?",
    "Hi {{name}}, noticed your activity in {{group}}. Quick one — how's business been with customers for live chat?",
    "Hey {{name}}, I saw you in {{group}} and got curious. Are customers coming in steady for your OnlyFans & live sessions?",
    "Hey {{name}}, spotted you posting in {{group}}. How's the customer flow for your content and private shows?",
    "Hi {{name}}, saw you in the {{group}} group. Been getting good customers for your live chat service?",
    "Hey {{name}}, noticed you in {{group}}. Just wondering if you've been getting solid customers lately?",
    "Hey {{name}}, saw your posts in the {{group}} group. How are things going with pulling in customers for live chat?",
    "Hi {{name}}, I saw you active in {{group}}. Are you getting decent traction with customers for your content?",
    "Hey {{name}}, caught you in {{group}}. Mind if I ask how customer acquisition is going for your OnlyFans & live chat?",
    "Hey {{name}}, saw you in the {{group}} group today. How's the paying customer side been?",
    "Hi {{name}}, noticed you in {{group}}. Quick question — customers coming through okay for your live sessions?",
    "Hey {{name}}, spotted your activity in {{group}}. Been getting consistent customers for your content and live chat?",
    "Hey {{name}}, I saw you posting in {{group}}. How's business been with fans paying for your live service?",
    "Hi {{name}}, saw you in the {{group}} group. Are you pulling in good customers for your OnlyFans & live chats?",
    "Hey {{name}}, noticed you around in {{group}}. Just curious how customer flow has been lately?",
    "Hey {{name}}, saw your posts in {{group}}. You getting decent paying customers for your live sessions?",
    "Hi {{name}}, I came across you in the {{group}} group. How's it going with customers for your content?",
    "Hey {{name}}, spotted you in {{group}}. Mind if I ask if customers have been coming in for your live chat?",
    "Hey {{name}}, saw you active in the {{group}} group. How's the customer situation for your OnlyFans & live service?",
    "Hi {{name}}, noticed your activity in {{group}}. Been getting steady customers for your content and private shows?",
    "Hey {{name}}, I saw you in {{group}} earlier. Quick one — are you getting good customers for your live chats?",
    "Hey {{name}}, saw you posting in the {{group}} group. How's customer flow been for your OnlyFans & live chat lately?"
].join('\n');

const DEFAULT_PART2_CHATFLOW = `OFCharmer = You (representing OFCharmer — the AI tool)



Model = The OnlyFans / live cam model you're trying to sell the webapp to

The tone stays extremely realistic, casual, helpful, and peer-to-peer (like one creator talking to another).

OFcharmer: Hey, saw you active in the group earlier 😊
Model: hey what's up
OFcharmer: lol not much, just been helping some creators with this AI thing I built
your posts in the group caught my eye, you seem pretty active
what made you join that group anyway?
Model: just looking for promo and new fans mostly
OFcharmer: same reason a lot of us are here haha
I've been grinding DMs for years and it was killing me — replying at 3am, running out of fresh pics, fans ghosting if I didn't reply fast…
So I built this AI called OFCharmer that basically clones how I chat and handles everything for OnlyFans & live chat creators.
Model: oh interesting
OFcharmer: yeah it's still in beta but it's working really well.
It does three main things:

Learns your exact chatting style from just one sample convo you give it — sounds 100% like you, no bot vibes.
Generates custom pics on demand from only one photo of you. Fan asks for something specific? It creates it instantly.
Finds prospects in your niche on Telegram and auto-messages them to bring in new subs 24/7.

I've been using it and it's honestly saved me so much time and boosted my earnings while I sleep.
Would you wanna see a quick live demo? I can generate a custom pic right now to show you how it works.
Model: sure, why not
OFcharmer: cool 😊
Tell me a typical request your fans usually ask for — like "ass in yoga pants" or "red lingerie tease" or whatever your niche is. I'll generate one live using just one reference photo style.
Model: hmm usually they ask for booty pics in yoga pants from behind
OFcharmer: got it.
Hold on… uploading a quick reference… generating now…
[Send AI-generated image: realistic booty in yoga pants from behind]
There — that was made from just one sample photo. The AI keeps your body/face consistent but changes the pose/outfit exactly how the fan wants.
Fans think you're sending it live, so they stay engaged and buy more PPV or customs.
The best part is once you train it on one of your real chat logs, it replies exactly like you would — same slang, same energy.
Model: damn that looks pretty good
OFcharmer: right? Most creators I've shown it to get hooked after seeing the image part.
It also has the prospecting feature — it can scan groups and auto-send personalized messages like what I did with you.
Wanna try the beta yourself? It's completely free right now for early testers (no card needed). Setup takes like 2 minutes — just upload one good photo + one short chat sample from your DMs.
Link: https://ofcharmer.vercel.app/
If you want, I can walk you through the first test or answer any questions. No pressure at all.
Model: alright I'll check it out
OFcharmer: nice! Once you're in, start with the image generator tab — upload one pic and try a wild request. Then train the voice with a short convo.
Let me know how it goes or if you get stuck — happy to help 😊`;

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

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    useEffect(() => {
        fetchAccounts();
        checkStatus();
        fetchLeads();
        const botInterval = setInterval(checkStatus, 5000);

        // Poll backend blast status every 2 s so UI stays in sync
        // even when the tab was reopened after being closed mid-blast.
        const blastInterval = setInterval(async () => {
            try {
                const res = await fetch('/api/outreach/blast/status');
                if (!res.ok) return;
                const d = await res.json();
                const running = d.status === 'running';
                setIsSending(running);
                if (d.countdown !== undefined) setCountdown(d.countdown);
                if (d.current_target !== undefined) setCurrentTarget(d.current_target);
                if (d.sent_usernames) setSentUsernames(d.sent_usernames);
                if (d.failed_usernames) setFailedUsernames(d.failed_usernames);
                if (Array.isArray(d.logs) && d.logs.length > 0) setLogs(d.logs);
            } catch (_) {}
        }, 2000);

        return () => {
            clearInterval(botInterval);
            clearInterval(blastInterval);
        };
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
                    if (path.startsWith('data:')) return path;
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
                // data.path is a GitHub URL, base64 data URL, or local relative path
                const proxyUrl = (data.path && (
                    data.path.startsWith('data:') ||
                    data.path.startsWith('http://') ||
                    data.path.startsWith('https://') ||
                    data.path.startsWith('/api/')
                        ? data.path
                        : `/api/uploads/${data.path}`));
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

        try {
            const res = await fetch('/api/outreach/blast/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accountId: selectedAccountId,
                    usernames,
                    outreachMessage,
                    sendTeasePic,
                    scrapedLeads,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setIsSending(true);
                setSentUsernames([]);
                setFailedUsernames([]);
                setCurrentTarget(null);
                setLogs([]);
                addLog(`[Outreach] Blast started on server — ${data.total} targets${data.capped ? ` (capped at ${data.daily_cap} for safety)` : ''}.`);
            } else {
                addLog(`[Outreach] ❌ Failed to start: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            addLog(`[Outreach] ❌ Network error: ${error.message}`);
        }
    };

    const handleStopOutreach = async () => {
        try {
            await fetch('/api/outreach/blast/stop', { method: 'POST' });
            addLog('[Outreach] ⏳ Stop requested — finishing current message...');
        } catch (error) {
            addLog(`[Outreach] ❌ Stop error: ${error.message}`);
        }
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
                                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                        <h3 style={{ margin: 0, flexShrink: 0 }}>Prospect Database ({scrapedLeads.length})</h3>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginLeft: 'auto' }}>
                                            <button className="btn" style={{ fontSize: '12px', whiteSpace: 'nowrap' }} onClick={fetchLeads}>Refresh</button>
                                            <button className="btn" style={{ fontSize: '12px', whiteSpace: 'nowrap' }} onClick={toggleSelectAll}>Select All</button>
                                            <button className="btn btn-primary" style={{ fontSize: '12px', whiteSpace: 'nowrap' }} onClick={() => {
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
