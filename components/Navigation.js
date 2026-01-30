'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export default function Navigation() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setIsMobileMenuOpen(false);
        }
    };

    return (
        <nav style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            background: 'rgba(10, 10, 20, 0.95)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
            <div className="container" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 2rem',
                maxWidth: '1400px',
                margin: '0 auto',
            }}>
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
                    onClick={() => scrollToSection('hero')}>
                    <Image
                        src="/ofcharmer-logo.png"
                        alt="OFCharmer"
                        width={40}
                        height={40}
                    />
                    <span style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                        OFCharmer
                    </span>
                </div>

                {/* Desktop Menu */}
                <div style={{
                    display: 'flex',
                    gap: '2rem',
                    alignItems: 'center',
                    '@media (max-width: 768px)': { display: 'none' }
                }} className="desktop-menu">
                    <button onClick={() => scrollToSection('pricing')} className="nav-link">Pricing</button>
                    <button onClick={() => scrollToSection('testimonials')} className="nav-link">Testimonials</button>
                    <button onClick={() => scrollToSection('faq')} className="nav-link">FAQ</button>
                    <button onClick={() => scrollToSection('accounts')} className="btn btn-primary" style={{ padding: '0.5rem 1.5rem' }}>
                        My Account
                    </button>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="mobile-menu-btn"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    style={{
                        display: 'none',
                        background: 'none',
                        border: 'none',
                        color: 'white',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                    }}
                >
                    ☰
                </button>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <div className="mobile-menu" style={{
                    background: 'rgba(10, 10, 20, 0.98)',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                }}>
                    <button onClick={() => scrollToSection('pricing')} className="nav-link">Pricing</button>
                    <button onClick={() => scrollToSection('testimonials')} className="nav-link">Testimonials</button>
                    <button onClick={() => scrollToSection('faq')} className="nav-link">FAQ</button>
                    <button onClick={() => scrollToSection('accounts')} className="btn btn-primary">
                        My Account
                    </button>
                </div>
            )}

            <style jsx>{`
                .nav-link {
                    background: none;
                    border: none;
                    color: rgba(255, 255, 255, 0.8);
                    cursor: pointer;
                    font-size: 1rem;
                    transition: color 0.2s;
                    padding: 0.5rem 0;
                }
                .nav-link:hover {
                    color: var(--color-primary);
                }
                @media (max-width: 768px) {
                    .desktop-menu {
                        display: none !important;
                    }
                    .mobile-menu-btn {
                        display: block !important;
                    }
                }
            `}</style>
        </nav>
    );
}
