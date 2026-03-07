'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { FiSend, FiUser, FiMoreVertical, FiImage, FiArrowLeft } from 'react-icons/fi';
import DashboardSidebar from '../../components/DashboardSidebar';
import { toast } from 'react-hot-toast';

function MessagesContent() {
    const searchParams = useSearchParams();
    const accountId = searchParams.get('accountId');
    const [sessions, setSessions] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (accountId) {
            fetchSessions();
        }
    }, [accountId]);

    useEffect(() => {
        if (activeSession) {
            fetchHistory();
            const interval = setInterval(fetchHistory, 5000); // Poll for new messages
            return () => clearInterval(interval);
        }
    }, [activeSession]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchSessions = async () => {
        try {
            const res = await fetch(`/api/chat/history?accountId=${accountId}`);
            const data = await res.json();
            if (data.status === 'success') {
                setSessions(data.sessions);
                if (data.sessions.length > 0 && !activeSession) {
                    setActiveSession(data.sessions[0]);
                }
            }
        } catch (error) {
            toast.error('Failed to load chat sessions');
        }
    };

    const fetchHistory = async () => {
        if (!activeSession) return;
        try {
            const res = await fetch(`/api/chat/history?sessionId=${activeSession.id}`);
            const data = await res.json();
            if (data.status === 'success') {
                setMessages(data.messages);
            }
        } catch (error) {
            console.error('Failed to load history:', error);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeSession || sending) return;

        setSending(true);
        try {
            const res = await fetch('/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accountId,
                    recipient: activeSession.remote_user_id,
                    message: newMessage
                })
            });

            if (res.ok) {
                setNewMessage('');
                fetchHistory();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to send message');
            }
        } catch (error) {
            toast.error('Network error. Failed to send.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div style={{ display: 'flex', height: '100vh', background: '#0f0f1e', color: 'white' }}>
            <DashboardSidebar />

            <main style={{ flex: 1, marginLeft: '240px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                    {/* Sessions Sidebar */}
                    <div style={{
                        width: '320px',
                        borderRight: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'rgba(15, 15, 30, 0.4)'
                    }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: '700' }}>Messages</h2>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {sessions.length === 0 ? (
                                <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5, fontSize: '0.9rem' }}>
                                    No active chats found
                                </div>
                            ) : (
                                sessions.map(s => (
                                    <div
                                        key={s.id}
                                        onClick={() => setActiveSession(s)}
                                        style={{
                                            padding: '1rem 1.5rem',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid rgba(255,255,255,0.03)',
                                            background: activeSession?.id === s.id ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                            borderLeft: activeSession?.id === s.id ? '3px solid #6366f1' : '3px solid transparent',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                                            {s.username ? `@${s.username}` : `User ${s.remote_user_id}`}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', opacity: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                                            <span>{s.state}</span>
                                            <span>{new Date(s.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.01)' }}>
                        {activeSession ? (
                            <>
                                <header style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <FiUser />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '700' }}>{activeSession.username ? `@${activeSession.username}` : `User ${activeSession.remote_user_id}`}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#4ade80' }}>Online</div>
                                        </div>
                                    </div>
                                    <FiMoreVertical style={{ cursor: 'pointer', opacity: 0.5 }} />
                                </header>

                                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {messages.map(m => (
                                        <div
                                            key={m.id}
                                            style={{
                                                alignSelf: m.role === 'assistant' ? 'flex-end' : 'flex-start',
                                                maxWidth: '70%',
                                                textAlign: 'left'
                                            }}
                                        >
                                            <div style={{
                                                background: m.role === 'assistant' ? '#6366f1' : 'rgba(255,255,255,0.05)',
                                                borderRadius: m.role === 'assistant' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                                                padding: '0.8rem 1.2rem',
                                                fontSize: '0.95rem',
                                                lineHeight: '1.4',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                            }}>
                                                {m.content}
                                                {m.content && m.content.includes('/api/assets/image') && (
                                                    <div style={{ marginTop: '0.5rem' }}>
                                                        <img src={m.content} alt="Content" style={{ maxWidth: '100%', borderRadius: '12px' }} />
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '0.7rem', opacity: 0.4, marginTop: '0.25rem', textAlign: m.role === 'assistant' ? 'right' : 'left' }}>
                                                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>

                                <footer style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <form onSubmit={handleSend} style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                                        <input
                                            type="text"
                                            placeholder="Type a message..."
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            style={{
                                                flex: 1,
                                                background: 'rgba(255,255,255,0.03)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '12px',
                                                padding: '1rem 1.5rem',
                                                color: 'white',
                                                outline: 'none',
                                                fontSize: '1rem'
                                            }}
                                        />
                                        <button
                                            type="submit"
                                            disabled={sending}
                                            style={{
                                                background: '#6366f1',
                                                border: 'none',
                                                borderRadius: '12px',
                                                width: '56px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                transform: sending ? 'scale(0.95)' : 'scale(1)'
                                            }}
                                        >
                                            <FiSend size={24} style={{ marginLeft: '2px' }} />
                                        </button>
                                    </form>
                                </footer>
                            </>
                        ) : (
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', opacity: 0.3 }}>
                                <FiImage size={64} style={{ marginBottom: '1rem' }} />
                                <div>Select a conversation to start chatting</div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function MessagesPage() {
    return (
        <Suspense fallback={<div style={{ background: '#05050a', minHeight: '100vh' }}></div>}>
            <MessagesContent />
        </Suspense>
    );
}
