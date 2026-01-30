'use client';

import { useState } from 'react';
import Image from 'next/image';
import AccountsList from '@/components/AccountsList';
import AccountConnectionModal from '@/components/AccountConnectionModal';

export default function Home() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleAccountAdded = () => {
        setIsModalOpen(false);
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <div className="page">
            {/* Hero Section */}
            <section className="hero">
                <div className="container">
                    <div className="hero-content">
                        <Image
                            src="/ofcharmer-logo.png"
                            alt="OFCharmer"
                            width={200}
                            height={200}
                            priority
                            style={{ marginBottom: '2rem' }}
                        />
                        <h1 className="title">
                            Turn Every Telegram Message Into
                            <br />
                            <span className="gradient-text">Paying Fans</span>
                        </h1>
                        <p className="subtitle">
                            AI-powered chatbot that talks just like you. Sends custom photos.
                            Converts DMs into PPV sales automatically—while you sleep.
                        </p>

                        {/* Stats Bar */}
                        <div style={{
                            display: 'flex',
                            gap: '3rem',
                            justifyContent: 'center',
                            margin: '2rem 0',
                            flexWrap: 'wrap'
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>24/7</div>
                                <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Automated Responses</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>3X</div>
                                <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>More Conversions</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>$0</div>
                                <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>To Get Started</div>
                            </div>
                        </div>

                        <button
                            className="btn btn-primary"
                            onClick={() => setIsModalOpen(true)}
                            style={{ fontSize: '1.2rem', padding: '1rem 2.5rem' }}
                        >
                            🚀 Start Free Trial
                        </button>
                        <p style={{
                            marginTop: '1rem',
                            fontSize: '0.85rem',
                            opacity: 0.7
                        }}>
                            No credit card required • Set up in 2 minutes
                        </p>
                    </div>
                </div>
            </section>

            {/* Problem Section */}
            <section style={{
                padding: '4rem 0',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
            }}>
                <div className="container">
                    <h2 style={{
                        textAlign: 'center',
                        fontSize: '2rem',
                        marginBottom: '3rem',
                        fontWeight: 'bold'
                    }}>
                        Tired of <span style={{ color: 'var(--color-danger)' }}>Losing Money</span> While You Sleep?
                    </h2>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '2rem',
                        maxWidth: '1000px',
                        margin: '0 auto'
                    }}>
                        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😴</div>
                            <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Can't Reply 24/7</h3>
                            <p style={{ opacity: 0.8 }}>Fans message at 3 AM. You're asleep. They move on to someone else.</p>
                        </div>

                        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
                            <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Same Messages, Different Fans</h3>
                            <p style={{ opacity: 0.8 }}>Typing the same flirty responses 100+ times a day gets exhausting.</p>
                        </div>

                        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💸</div>
                            <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>DMs Don't Convert</h3>
                            <p style={{ opacity: 0.8 }}>Hours chatting but they ghost when you send the PPV link.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Solution Section */}
            <section style={{ padding: '4rem 0' }}>
                <div className="container">
                    <h2 style={{
                        textAlign: 'center',
                        fontSize: '2rem',
                        marginBottom: '1rem',
                        fontWeight: 'bold'
                    }}>
                        Meet Your AI Clone That <span className="gradient-text">Never Sleeps</span>
                    </h2>
                    <p style={{ textAlign: 'center', opacity: 0.8, marginBottom: '3rem', maxWidth: '700px', margin: '0 auto 3rem' }}>
                        OFCharmer learns YOUR voice, YOUR style, YOUR flirting. It handles every DM like YOU would—but 24/7.
                    </p>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '2rem',
                        marginTop: '3rem'
                    }}>
                        <div className="card">
                            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🧠</div>
                            <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>AI That Talks Like YOU</h3>
                            <p style={{ opacity: 0.9, lineHeight: '1.7' }}>
                                Train the bot with your messages. It learns your tone, your emojis, your sass.
                                Fans won't know they're talking to AI.
                            </p>
                        </div>

                        <div className="card">
                            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📸</div>
                            <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Smart Photo Sending</h3>
                            <p style={{ opacity: 0.9, lineHeight: '1.7' }}>
                                "Send me a pic in red" → Bot sends from your library. Custom requests?
                                You set limits (3/day or whatever you want).
                            </p>
                        </div>

                        <div className="card">
                            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💰</div>
                            <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Auto PPV Conversion</h3>
                            <p style={{ opacity: 0.9, lineHeight: '1.7' }}>
                                Smooth conversation flow → teases → perfectly timed PPV link.
                                Natural. Effective. Converts like crazy.
                            </p>
                        </div>

                        <div className="card">
                            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📱</div>
                            <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Multiple Telegram Accounts</h3>
                            <p style={{ opacity: 0.9, lineHeight: '1.7' }}>
                                Scale your reach. Add more Telegram accounts. Reach more fans.
                                More traffic = more $$$$.
                            </p>
                        </div>

                        <div className="card">
                            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚡</div>
                            <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Instant Replies, Always</h3>
                            <p style={{ opacity: 0.9, lineHeight: '1.7' }}>
                                3 AM? Noon? Doesn't matter. Your AI responds in seconds.
                                Never lose another fan to slow replies.
                            </p>
                        </div>

                        <div className="card">
                            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📊</div>
                            <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Track Everything</h3>
                            <p style={{ opacity: 0.9, lineHeight: '1.7' }}>
                                See what's working. Which messages convert. Which photos they love.
                                Optimize and make more money.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section style={{
                padding: '4rem 0',
                background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
                color: 'white',
                textAlign: 'center'
            }}>
                <div className="container">
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', fontWeight: 'bold' }}>
                        Ready to 3X Your OnlyFans Income?
                    </h2>
                    <p style={{ fontSize: '1.2rem', marginBottom: '2rem', opacity: 0.95 }}>
                        Join models who stopped losing sleep over DMs and started making money on autopilot.
                    </p>
                    <button
                        className="btn"
                        onClick={() => setIsModalOpen(true)}
                        style={{
                            background: 'white',
                            color: 'var(--color-primary)',
                            fontSize: '1.3rem',
                            padding: '1.2rem 3rem',
                            fontWeight: 'bold',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                        }}
                    >
                        🎯 Start Your Free Trial Now
                    </button>
                    <p style={{
                        marginTop: '1.5rem',
                        fontSize: '0.9rem',
                        opacity: 0.9
                    }}>
                        ✓ No technical skills needed  ✓ Set up in under 5 minutes  ✓ Cancel anytime
                    </p>
                </div>
            </section>

            {/* Accounts Section */}
            <section className="accounts-section">
                <div className="container">
                    <h2 style={{
                        textAlign: 'center',
                        fontSize: '2rem',
                        marginBottom: '3rem',
                        fontWeight: 'bold'
                    }}>
                        Your Connected Telegram Accounts
                    </h2>
                    <AccountsList key={refreshTrigger} onAddAccount={() => setIsModalOpen(true)} />
                </div>
            </section>

            {/* Modal */}
            {isModalOpen && (
                <AccountConnectionModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={handleAccountAdded}
                />
            )}
        </div>
    );
}
