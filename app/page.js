'use client';

import { useState } from 'react';
import Image from 'next/image';
import AccountsList from '@/components/AccountsList';
import AccountConnectionModal from '@/components/AccountConnectionModal';
import Navigation from '@/components/Navigation';

export default function Home() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleAccountAdded = () => {
        setIsModalOpen(false);
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <>
            <Navigation />

            <div className="page" style={{ paddingTop: '80px' }}>
                {/* Hero Section */}
                <section className="hero" id="hero">
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

                        {/* Phone Mockup Image */}
                        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                            <Image
                                src="/phone-conversation.png"
                                alt="AI chatbot conversation on phone"
                                width={400}
                                height={600}
                                style={{ borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
                            />
                        </div>

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

                {/* Pricing Section */}
                <section id="pricing" style={{
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
                            Simple, Transparent <span className="gradient-text">Pricing</span>
                        </h2>
                        <p style={{ textAlign: 'center', opacity: 0.8, marginBottom: '4rem', fontSize: '1.1rem' }}>
                            Start free, scale as you grow. No hidden fees.
                        </p>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                            gap: '2rem',
                            maxWidth: '1200px',
                            margin: '0 auto'
                        }}>
                            {/* Starter Plan */}
                            <div className="card" style={{ padding: '2.5rem', position: 'relative' }}>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Starter</h3>
                                <p style={{ opacity: 0.7, marginBottom: '2rem' }}>Perfect for solo creators</p>
                                <div style={{ marginBottom: '2rem' }}>
                                    <span style={{ fontSize: '3rem', fontWeight: 'bold' }}>$49</span>
                                    <span style={{ opacity: 0.7 }}>/month</span>
                                </div>
                                <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem' }}>
                                    <li style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        ✓ 1 Telegram Account
                                    </li>
                                    <li style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        ✓ AI Training (Your Voice)
                                    </li>
                                    <li style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        ✓ Smart Photo Library (50 images)
                                    </li>
                                    <li style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        ✓ PPV Auto-Conversion
                                    </li>
                                    <li style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        ✓ Basic Analytics
                                    </li>
                                </ul>
                                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setIsModalOpen(true)}>
                                    Start Free Trial
                                </button>
                            </div>

                            {/* Pro Plan - Most Popular */}
                            <div className="card" style={{
                                padding: '2.5rem',
                                position: 'relative',
                                border: '2px solid var(--color-primary)',
                                transform: 'scale(1.05)',
                            }}>
                                <div style={{
                                    position: 'absolute',
                                    top: '-15px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    background: 'var(--color-primary)',
                                    padding: '0.5rem 1.5rem',
                                    borderRadius: '20px',
                                    fontSize: '0.85rem',
                                    fontWeight: 'bold',
                                }}>
                                    MOST POPULAR
                                </div>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Pro</h3>
                                <p style={{ opacity: 0.7, marginBottom: '2rem' }}>Best for growing creators</p>
                                <div style={{ marginBottom: '2rem' }}>
                                    <span style={{ fontSize: '3rem', fontWeight: 'bold' }}>$99</span>
                                    <span style={{ opacity: 0.7 }}>/month</span>
                                </div>
                                <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem' }}>
                                    <li style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        ✓ 3 Telegram Accounts
                                    </li>
                                    <li style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        ✓ Advanced AI Training
                                    </li>
                                    <li style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        ✓ Smart Photo Library (Unlimited)
                                    </li>
                                    <li style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        ✓ PPV Auto-Conversion
                                    </li>
                                    <li style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        ✓ Advanced Analytics
                                    </li>
                                    <li style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        ✓ Priority Support
                                    </li>
                                </ul>
                                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setIsModalOpen(true)}>
                                    Start Free Trial
                                </button>
                            </div>

                            {/* Agency Plan */}
                            <div className="card" style={{ padding: '2.5rem', position: 'relative' }}>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Agency</h3>
                                <p style={{ opacity: 0.7, marginBottom: '2rem' }}>For agencies & teams</p>
                                <div style={{ marginBottom: '2rem' }}>
                                    <span style={{ fontSize: '3rem', fontWeight: 'bold' }}>$299</span>
                                    <span style={{ opacity: 0.7 }}>/month</span>
                                </div>
                                <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem' }}>
                                    <li style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        ✓ 10+ Telegram Accounts
                                    </li>
                                    <li style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        ✓ Custom AI Models
                                    </li>
                                    <li style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        ✓ Unlimited Everything
                                    </li>
                                    <li style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        ✓ Multi-Model Management
                                    </li>
                                    <li style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        ✓ White-label Option
                                    </li>
                                    <li style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        ✓ Dedicated Success Manager
                                    </li>
                                </ul>
                                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setIsModalOpen(true)}>
                                    Contact Sales
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Testimonials Section */}
                <section id="testimonials" style={{ padding: '5rem 0' }}>
                    <div className="container">
                        <h2 style={{
                            textAlign: 'center',
                            fontSize: '2.5rem',
                            marginBottom: '1rem',
                            fontWeight: 'bold'
                        }}>
                            What <span className="gradient-text">Creators Say</span>
                        </h2>
                        <p style={{ textAlign: 'center', opacity: 0.8, marginBottom: '4rem', fontSize: '1.1rem' }}>
                            Real results from real creators
                        </p>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                            gap: '2rem',
                            maxWidth: '1200px',
                            margin: '0 auto'
                        }}>
                            <div className="card" style={{ padding: '2rem' }}>
                                <div style={{ marginBottom: '1rem' }}>⭐⭐⭐⭐⭐</div>
                                <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem', lineHeight: '1.7' }}>
                                    "I was skeptical at first but OFCharmer literally 3X'd my income in the first month.
                                    My fans love chatting and I'm making money while I sleep. Game changer!"
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{
                                        width: '50px',
                                        height: '50px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.5rem',
                                        fontWeight: 'bold'
                                    }}>S</div>
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>Sarah M.</div>
                                        <div style={{ opacity: 0.7, fontSize: '0.9rem' }}>OnlyFans Creator</div>
                                    </div>
                                </div>
                            </div>

                            <div className="card" style={{ padding: '2rem' }}>
                                <div style={{ marginBottom: '1rem' }}>⭐⭐⭐⭐⭐</div>
                                <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem', lineHeight: '1.7' }}>
                                    "The AI learns my personality so well that my fans can't tell the difference.
                                    I finally have time to create content instead of typing the same DMs all day."
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{
                                        width: '50px',
                                        height: '50px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.5rem',
                                        fontWeight: 'bold'
                                    }}>A</div>
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>Ashley K.</div>
                                        <div style={{ opacity: 0.7, fontSize: '0.9rem' }}>Fansly Creator</div>
                                    </div>
                                </div>
                            </div>

                            <div className="card" style={{ padding: '2rem' }}>
                                <div style={{ marginBottom: '1rem' }}>⭐⭐⭐⭐⭐</div>
                                <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem', lineHeight: '1.7' }}>
                                    "Best investment I've made. My PPV sales are through the roof and I don't have to
                                    be glued to my phone 24/7. Worth every penny!"
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{
                                        width: '50px',
                                        height: '50px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.5rem',
                                        fontWeight: 'bold'
                                    }}>M</div>
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>Mia R.</div>
                                        <div style={{ opacity: 0.7, fontSize: '0.9rem' }}>OnlyFans Top 1%</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

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
                                question="How does the AI learn my voice?"
                                answer="You'll train the AI by providing sample messages from your actual conversations. The more examples you give, the better it gets at mimicking your tone, emoji usage, and personality. Most creators see great results after training with 50-100 messages."
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

                {/* Accounts Section */}
                <section className="accounts-section" id="accounts" style={{ padding: '5rem 0' }}>
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
        </>
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
