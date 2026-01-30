'use client';

import { useState, useEffect } from 'react';

export default function Testimonials() {
    const [activeIndex, setActiveIndex] = useState(0);

    const testimonials = [
        {
            text: "I was skeptical at first but OFCharmer literally 3X'd my income in the first month. My fans love chatting and I'm making money while I sleep. Game changer!",
            author: "Sarah M.",
            role: "OnlyFans Creator",
            initial: "S"
        },
        {
            text: "The AI learns my personality so well that my fans can't tell the difference. I finally have time to create content instead of typing the same DMs all day.",
            author: "Ashley K.",
            role: "Fansly Creator",
            initial: "A"
        },
        {
            text: "Best investment I've made. My PPV sales are through the roof and I don't have to be glued to my phone 24/7. Worth every penny!",
            author: "Mia R.",
            role: "OnlyFans Top 1%",
            initial: "M"
        },
        {
            text: "The credit system is so fair. I only pay when I make money. The 'smart photo' feature is genius for upselling custom content.",
            author: "Lexi D.",
            role: "Content Creator",
            initial: "L"
        }
    ];

    const nextTestimonial = () => {
        setActiveIndex((prev) => (prev + 1) % testimonials.length);
    };

    const prevTestimonial = () => {
        setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    };

    // Auto-advance
    useEffect(() => {
        const interval = setInterval(nextTestimonial, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
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
                    maxWidth: '800px',
                    margin: '0 auto',
                    position: 'relative',
                    overflow: 'hidden',
                    padding: '1rem'
                }}>
                    <div className="card" style={{
                        padding: '3rem',
                        textAlign: 'center',
                        minHeight: '300px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        transition: 'opacity 0.3s ease'
                    }}>
                        <div style={{ marginBottom: '1.5rem', fontSize: '1.2rem', color: '#fbbf24' }}>⭐⭐⭐⭐⭐</div>
                        <p style={{
                            fontSize: '1.4rem',
                            marginBottom: '2rem',
                            lineHeight: '1.6',
                            fontStyle: 'italic',
                            opacity: 0.95
                        }}>
                            "{testimonials[activeIndex].text}"
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center' }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.8rem',
                                fontWeight: 'bold'
                            }}>
                                {testimonials[activeIndex].initial}
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{testimonials[activeIndex].author}</div>
                                <div style={{ opacity: 0.7, fontSize: '0.9rem' }}>{testimonials[activeIndex].role}</div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    <button
                        onClick={prevTestimonial}
                        style={{
                            position: 'absolute',
                            left: '0',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(0,0,0,0.5)',
                            border: 'none',
                            color: 'white',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            fontSize: '1.5rem',
                            zIndex: 10
                        }}
                    >
                        ‹
                    </button>
                    <button
                        onClick={nextTestimonial}
                        style={{
                            position: 'absolute',
                            right: '0',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(0,0,0,0.5)',
                            border: 'none',
                            color: 'white',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            fontSize: '1.5rem',
                            zIndex: 10
                        }}
                    >
                        ›
                    </button>

                    {/* Dots */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
                        {testimonials.map((_, i) => (
                            <div
                                key={i}
                                onClick={() => setActiveIndex(i)}
                                style={{
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    background: i === activeIndex ? 'var(--color-primary)' : 'rgba(255,255,255,0.2)',
                                    cursor: 'pointer',
                                    transition: 'background 0.3s'
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
