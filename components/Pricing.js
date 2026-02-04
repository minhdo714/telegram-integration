'use client';

import { useState } from 'react';

export default function Pricing({ onOpenModal }) {
    const [activeIndex, setActiveIndex] = useState(1); // Default to middle plan

    const plans = [
        {
            price: 9,
            credits: 1000,
            name: "Starter",
            features: [
                "1 Telegram Account",
                "1,000 AI Credits (Messages)",
                "Basic AI Training",
                "50 Smart Photos",
                "Standard Support"
            ],
            bestFor: "Just starting out"
        },
        {
            price: 24,
            credits: 3000,
            name: "Growth",
            features: [
                "3 Telegram Accounts",
                "3,000 AI Credits (Messages)",
                "Advanced AI Training",
                "Unlimited Smart Photos",
                "Priority Support"
            ],
            bestFor: "Growing creators",
            popular: true
        },
        {
            price: 99,
            credits: 15000,
            name: "Scale",
            features: [
                "15 Telegram Accounts",
                "15,000 AI Credits (Messages)",
                "Custom AI Models",
                "White-label Options",
                "Dedicated Account Manager"
            ],
            bestFor: "Agencies & Top 1%"
        }
    ];

    const nextPlan = () => {
        setActiveIndex((prev) => (prev + 1) % plans.length);
    };

    const prevPlan = () => {
        setActiveIndex((prev) => (prev - 1 + plans.length) % plans.length);
    };

    const currentPlan = plans[activeIndex];

    return (
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
                    Simple <span className="gradient-text">Credit Pricing</span>
                </h2>
                <p style={{ textAlign: 'center', opacity: 0.8, marginBottom: '3rem', fontSize: '1.1rem' }}>
                    Pay for what you use. 1 Credit = 1 AI Message.
                </p>

                <div style={{
                    maxWidth: '600px',
                    margin: '0 auto',
                    position: 'relative',
                    padding: '0 2rem' // Add padding for arrows
                }}>
                    {/* Selected Plan Card */}
                    <div className="card" style={{
                        padding: '3rem',
                        textAlign: 'center',
                        border: currentPlan.popular ? '2px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.1)',
                        transform: 'scale(1.02)',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        zIndex: 2
                    }}>
                        {currentPlan.popular && (
                            <div style={{
                                background: 'var(--color-primary)',
                                color: 'white',
                                padding: '0.5rem 1rem',
                                borderRadius: '20px',
                                fontSize: '0.8rem',
                                fontWeight: 'bold',
                                display: 'inline-block',
                                marginBottom: '1rem'
                            }}>
                                MOST POPULAR
                            </div>
                        )}

                        <h3 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{currentPlan.name}</h3>
                        <p style={{ opacity: 0.7, marginBottom: '2rem' }}>{currentPlan.bestFor}</p>

                        <div style={{ marginBottom: '2rem' }}>
                            <span style={{ fontSize: '4rem', fontWeight: 'bold' }}>${currentPlan.price}</span>
                            <div style={{ fontSize: '1.2rem', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                                {currentPlan.credits.toLocaleString()} Credits
                            </div>
                        </div>

                        <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2.5rem', textAlign: 'left' }}>
                            {currentPlan.features.map((feature, i) => (
                                <li key={i} style={{
                                    padding: '1rem 0',
                                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>✓</span> {feature}
                                </li>
                            ))}
                        </ul>

                        {/* Free Trial Highlight */}
                        <div style={{
                            background: 'rgba(0, 242, 254, 0.1)',
                            padding: '1rem',
                            borderRadius: '8px',
                            marginBottom: '2rem',
                            border: '1px dashed var(--color-primary)',
                            fontWeight: 'bold',
                            color: 'var(--color-primary)'
                        }}>
                            🎁 Includes 7-Day Free Trial
                        </div>

                        <button
                            className="btn btn-primary"
                            style={{ width: '100%', fontSize: '1.2rem', padding: '1rem' }}
                            onClick={onOpenModal}
                        >
                            Start 7-Day Free Trial
                        </button>
                        <p style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.6 }}>No credit card required</p>
                    </div>

                    {/* Navigation Buttons - Outside Card */}
                    <button
                        onClick={prevPlan}
                        style={{
                            position: 'absolute',
                            left: '-20px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: 'white',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            fontSize: '1.5rem',
                            zIndex: 10,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backdropFilter: 'blur(5px)'
                        }}
                    >
                        ‹
                    </button>
                    <button
                        onClick={nextPlan}
                        style={{
                            position: 'absolute',
                            right: '-20px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: 'white',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            fontSize: '1.5rem',
                            zIndex: 10,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backdropFilter: 'blur(5px)'
                        }}
                    >
                        ›
                    </button>
                </div>

                {/* Dots */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.8rem', marginTop: '3rem' }}>
                    {plans.map((_, i) => (
                        <div
                            key={i}
                            onClick={() => setActiveIndex(i)}
                            style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: i === activeIndex ? 'var(--color-primary)' : 'rgba(255,255,255,0.2)',
                                cursor: 'pointer',
                                transition: 'all 0.3s'
                            }}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
