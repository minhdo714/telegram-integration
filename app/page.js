'use client';

import { useState, Suspense } from 'react';
import Image from 'next/image';
import AccountConnectionModal from '@/components/AccountConnectionModal';
import MessageComposer from '@/components/MessageComposer';
import Navigation from '@/components/Navigation';
import Pricing from '@/components/Pricing';
import Testimonials from '@/components/Testimonials';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function HomeContent() {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMessageComposerOpen, setIsMessageComposerOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleAccountAdded = () => {
        setIsModalOpen(false);
        setRefreshTrigger(prev => prev + 1);
        router.push('/config');
    };

    return (
        <>
            <Navigation />

            <div className="page" style={{ paddingTop: '80px' }}>
                {/* Hero Section */}
                <section className="hero" id="hero">
                    <div className="container">
                        <div className="hero-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                            <Image
                                src="/phone-conversation-square.png"
                                alt="OFCharmer"
                                width={200}
                                height={200}
                                priority
                                style={{ marginBottom: '2rem', borderRadius: '20px' }}
                            />
                            <h1 className="title">
                                Meet Your <span className="gradient-text">AI Clone</span> That Sends
                                <br />
                                <span className="gradient-text">Custom Photos on Demand</span>
                            </h1>
                            <p className="subtitle">
                                The only AI that learns your <strong>EXACT Vibe</strong> from your real chats.
                                <br />
                                Sends photos from your library when fans ask. Converts DMs into $$$ 24/7.
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

                            <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setIsModalOpen(true)}
                                    style={{ fontSize: '1.2rem', padding: '1rem 2.5rem' }}
                                >
                                    🚀 Start Free Trial
                                </button>
                            </div>
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

                        {/* Phone Mockup Image */}
                        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                            <Image
                                src="/phone-conversation-square.png"
                                alt="AI chatbot conversation on phone"
                                width={500}
                                height={500}
                                style={{ borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxWidth: '100%', height: 'auto' }}
                            />
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                            gap: '2rem',
                            marginTop: '3rem'
                        }}>
                            {/* Priority 1: Image on Demand */}
                            <div className="card">
                                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📸</div>
                                <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Image on Demand</h3>
                                <p style={{ opacity: 0.9, lineHeight: '1.7' }}>
                                    Fan asks for a "red dress pic"? <strong>She sends it instantly.</strong>
                                    <br />
                                    Upload your content, tag it (e.g., "bikini", "legs"), and the AI finds sending the perfect shot when asked.
                                    <br />
                                    <span style={{ color: '#4ade80', fontSize: '0.9rem' }}>✓ Never miss a PPV opportunity again.</span>
                                </p>
                            </div>

                            {/* Priority 2: Autochat Vibe */}
                            <div className="card">
                                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🧠</div>
                                <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Clones Your EXACT Vibe</h3>
                                <p style={{ opacity: 0.9, lineHeight: '1.7' }}>
                                    Your AI doesn't just "talk" based on a prompt.
                                    <br />
                                    <strong>It learns from your REAL chat logs.</strong>
                                    <br />
                                    It adopts your slang, your emoji habits, and your flirting style. Fans will swear it's you.
                                </p>
                            </div>

                            {/* Priority 3: Prospect Discovery (New) */}
                            <div className="card">
                                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎯</div>
                                <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Find & Blast 1000s of Prospects</h3>
                                <p style={{ opacity: 0.9, lineHeight: '1.7' }}>
                                    Stop waiting for DMs. Our AI finds hundreds of active users in your niche instantly.
                                    <br />
                                    Add them to a blast list and automate cold messaging to fill your funnel on autopilot.
                                </p>
                            </div>

                            {/* Priority 4: 24/7 Income */}
                            <div className="card">
                                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>😴</div>
                                <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Make Money While You Sleep</h3>
                                <p style={{ opacity: 0.9, lineHeight: '1.7' }}>
                                    Whales don't sleep, and neither does your AI.
                                    <br />
                                    It replies instantly to every "Hi" at 3 AM, turning late-night grazers into paying subscribers before they lose interest.
                                </p>
                            </div>

                            {/* Priority 4: Auto PPV */}
                            <div className="card">
                                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💰</div>
                                <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Automated Sales Funnel</h3>
                                <p style={{ opacity: 0.9, lineHeight: '1.7' }}>
                                    It doesn't just chat; it <strong>sells</strong>.
                                    <br />
                                    Builds rapport ➝ Teases the content ➝ Drops the PPV link at the perfect moment.
                                    <br />
                                    A relentless sales machine that never gets tired of rejection.
                                </p>
                            </div>

                            {/* Priority 5: Safety & Control */}
                            <div className="card">
                                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🛡️</div>
                                <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>You're Always in Control</h3>
                                <p style={{ opacity: 0.9, lineHeight: '1.7' }}>
                                    Jump in and take over a conversation anytime.
                                    <br />
                                    The AI is your wingman, not your boss. Monitor chats in real-time or let it run on autopilot.
                                </p>
                            </div>

                            {/* Priority 6: Scaling */}
                            <div className="card">
                                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📈</div>
                                <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Scale to Infinity</h3>
                                <p style={{ opacity: 0.9, lineHeight: '1.7' }}>
                                    Run 1, 10, or 50 Telegram accounts simultaneously.
                                    <br />
                                    Manage an entire agency's worth of traffic from a single dashboard.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <Pricing onOpenModal={() => setIsModalOpen(true)} />

                <Testimonials />

                {/* FAQ Section */}
                <section id="faq" style={{
                    padding: '5rem 0',
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)',
                }}>
                    <div className="container">
                        <h2 style={{
                            textAlign: 'center',
                            fontSize: '2.5rem',
                            marginBottom: '1rem',
                            fontWeight: 'bold'
                        }}>
                            Frequently Asked <span className="gradient-text">Questions</span>
                        </h2>
                        <p style={{ textAlign: 'center', opacity: 0.8, marginBottom: '4rem', fontSize: '1.1rem' }}>
                            Everything you need to know
                        </p>

                        <div style={{
                            maxWidth: '800px',
                            margin: '0 auto',
                        }}>
                            <FAQItem
                                question="How does the AI learn my voice and style?"
                                answer="The AI learns from your TEXT chats that you input into its database. It analyzes your previous conversations to mimic your tone, vocabulary, and emoji usage perfectly. It does NOT listen to your voice or audio files—it's all based on your text communication style."
                            />
                            <FAQItem
                                question="Will fans know they're talking to a bot?"
                                answer="Nope! Our AI is incredibly sophisticated and personalizes every response. It learns YOUR unique style, uses YOUR emojis, and even adapts to each fan's personality. Most creators report that fans can't tell the difference."
                            />
                            <FAQItem
                                question="How does photo sending work?"
                                answer="You upload photos to your library and tag them (e.g., 'red dress', 'bikini', 'casual'). When a fan requests something, the AI matches their request to your tags and sends the perfect photo. You control daily limits to keep it exclusive."
                            />
                            <FAQItem
                                question="Can I use this with OnlyFans and Fansly?"
                                answer="Yes! OFCharmer works with Telegram, which is where most creators drive their most engaged fans. The bot handles Telegram DMs and drives fans to your OF/Fansly PPV links seamlessly."
                            />
                            <FAQItem
                                question="What if I want to take over a conversation?"
                                answer="You have full control! You can disable the AI for specific fans, take over conversations manually anytime, or set the AI to notify you for certain keywords or situations."
                            />
                            <FAQItem
                                question="Is there really a free trial?"
                                answer="Absolutely! 7 days free, no credit card required. You'll get full access to all features so you can see the results yourself before committing."
                            />
                            <FAQItem
                                question="How long does setup take?"
                                answer="Less than 5 minutes! Connect your Telegram account, upload some training messages and photos, set your preferences, and you're live. No technical skills needed."
                            />
                            <FAQItem
                                question="What happens to my existing fans?"
                                answer="They'll get even better service! The AI responds instantly (no more waiting hours), sends personalized messages, and converts them to PPV buyers more effectively. Your engagement will skyrocket."
                            />
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
                            className="btn btn-primary"
                            onClick={() => setIsModalOpen(true)}
                            style={{
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

                {/* Dashboard Shortcut Section (Replacing Old AccountsList) */}
                <section className="accounts-section" id="accounts" style={{
                    padding: '5rem 0',
                    background: '#0f172a'
                }}>
                    <div className="container" style={{ display: 'flex', justifyContent: 'center' }}>
                        <div className="card" style={{
                            textAlign: 'center',
                            padding: '4rem 2rem',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '24px',
                            backdropFilter: 'blur(20px)',
                            maxWidth: '800px',
                            width: '100%'
                        }}>
                            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🚀</div>
                            <h2 style={{
                                fontSize: '2.5rem',
                                color: 'white',
                                marginBottom: '1rem',
                                fontWeight: 'bold'
                            }}>
                                Welcome to Your <span className="gradient-text">Command Center</span>
                            </h2>
                            <p style={{
                                fontSize: '1.2rem',
                                color: 'rgba(255, 255, 255, 0.7)',
                                maxWidth: '600px',
                                margin: '0 auto 2.5rem'
                            }}>
                                Manage your Telegram accounts, proxies, and AI personas all in one place.
                                Scale your automated outreach with our premium dashboard.
                            </p>
                            <Link href="/accounts" style={{
                                display: 'inline-block',
                                background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
                                color: 'white',
                                padding: '1rem 3rem',
                                borderRadius: '12px',
                                fontWeight: 'bold',
                                fontSize: '1.1rem',
                                textDecoration: 'none',
                                transition: 'transform 0.2s',
                                boxShadow: '0 10px 30px rgba(99, 102, 241, 0.2)'
                            }}>
                                Open Tele Accounts Dashboard
                            </Link>
                        </div>
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

                <Footer />
            </div>
        </>
    );
}

export default function Home() {
    return (
        <Suspense fallback={<div style={{ background: '#05050a', minHeight: '100vh' }}></div>}>
            <HomeContent />
        </Suspense>
    );
}

function FAQItem({ question, answer }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="card" style={{
            marginBottom: '1rem',
            padding: '1.5rem',
            cursor: 'pointer',
        }} onClick={() => setIsOpen(!isOpen)}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0 }}>{question}</h3>
                <span style={{ fontSize: '1.5rem', transition: 'transform 0.3s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    ▼
                </span>
            </div>
            {isOpen && (
                <p style={{ marginTop: '1rem', opacity: 0.9, lineHeight: '1.7' }}>
                    {answer}
                </p>
            )}
        </div>
    );
}
