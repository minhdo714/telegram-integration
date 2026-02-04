'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const mode = searchParams.get('mode');

    // Default to 'register' if mode is 'register', otherwise 'login'
    const [isLogin, setIsLogin] = useState(mode !== 'register');
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });

    useEffect(() => {
        if (mode) {
            setIsLogin(mode !== 'register');
        }
    }, [mode]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(isLogin ? 'Welcome back!' : 'Account created successfully!');
                setTimeout(() => {
                    router.push('/');
                    router.refresh();
                }, 1000);
            } else {
                toast.error(data.error || 'Authentication failed');
            }
        } catch (error) {
            toast.error('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const containerStyle = {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#05050a',
        padding: '1rem',
        fontFamily: "'Inter', sans-serif"
    };

    const cardStyle = {
        display: 'flex',
        width: '100%',
        maxWidth: '1200px',
        backgroundColor: '#0f0f1a',
        borderRadius: '30px',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        minHeight: '700px'
    };

    const leftColumnStyle = {
        flex: '1',
        padding: '3rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: '#0f0f1a',
        zIndex: 10
    };

    const rightColumnStyle = {
        flex: '1',
        position: 'relative',
        backgroundColor: '#1a1a2e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem',
        overflow: 'hidden'
    };

    const inputGroupStyle = {
        position: 'relative',
        marginBottom: '1rem'
    };

    const inputStyle = {
        width: '100%',
        backgroundColor: '#1a1a2e',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '1rem 1rem 1rem 3rem',
        color: 'white',
        fontSize: '1rem',
        outline: 'none',
        transition: 'border-color 0.2s'
    };

    const iconStyle = {
        position: 'absolute',
        left: '1rem',
        top: '50%',
        transform: 'translateY(-50%)',
        color: '#6b7280',
        width: '20px',
        height: '20px'
    };

    const buttonStyle = {
        width: '100%',
        padding: '1rem',
        backgroundColor: '#3b82f6',
        color: 'white',
        fontWeight: 'bold',
        borderRadius: '12px',
        border: 'none',
        fontSize: '1.125rem',
        cursor: 'pointer',
        marginTop: '1rem',
        transition: 'background-color 0.2s',
        boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.2)'
    };

    const googleButtonStyle = {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        backgroundColor: '#1a1a2e',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '0.75rem',
        borderRadius: '0.5rem',
        color: '#d1d5db',
        fontWeight: '500',
        marginBottom: '1.5rem',
        cursor: 'pointer',
        transition: 'background-color 0.2s'
    };

    return (
        <div style={containerStyle}>
            {/* Main Card */}
            <div style={cardStyle}>
                {/* Left Column - Form */}
                <div style={leftColumnStyle}>
                    <div style={{ marginBottom: '2.5rem' }}>
                        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', textDecoration: 'none' }}>
                            <Image src="/ofcharmer-logo.png" alt="OFCharmer" width={40} height={40} />
                            <span style={{
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                background: 'linear-gradient(to right, #a78bfa, #60a5fa)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}>
                                OFCharmer
                            </span>
                        </Link>



                        <form onSubmit={handleSubmit}>
                            {!isLogin && (
                                <div style={inputGroupStyle}>
                                    <div style={iconStyle}>
                                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Full name"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        style={inputStyle}
                                    />
                                </div>
                            )}

                            <div style={inputGroupStyle}>
                                <div style={iconStyle}>
                                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <input
                                    type="email"
                                    placeholder="Email address"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>

                            <div style={inputGroupStyle}>
                                <div style={iconStyle}>
                                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                style={buttonStyle}
                            >
                                {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Create Account')}
                            </button>
                        </form>

                        <p style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '1.5rem', textAlign: 'center', lineHeight: '1.6' }}>
                            By continuing, you agree to OFCharmer's <Link href="/terms" style={{ color: '#60a5fa' }}>Terms of Service</Link>, <Link href="/privacy" style={{ color: '#60a5fa' }}>Privacy Policy</Link>, and <Link href="/acceptable-use" style={{ color: '#60a5fa' }}>Acceptable Use Policy</Link>.
                        </p>

                        <div style={{ marginTop: '2rem', textAlign: 'center', paddingTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <p style={{ color: '#9ca3af' }}>
                                {isLogin ? "Don't have an account? " : "Already have an account? "}
                                <button onClick={() => setIsLogin(!isLogin)} style={{ color: '#3b82f6', fontWeight: '600', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 'inherit' }}>
                                    {isLogin ? 'Sign up' : 'Sign in'}
                                </button>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Column - Testimonial */}
                <div style={rightColumnStyle} className="hidden-mobile">
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(49, 46, 129, 0.3) 0%, rgba(15, 15, 26, 1) 100%)', zIndex: 1 }}></div>

                    {/* Decorative blobs */}
                    <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '400px', height: '400px', backgroundColor: 'rgba(147, 51, 234, 0.2)', borderRadius: '50%', filter: 'blur(80px)' }}></div>
                    <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '400px', height: '400px', backgroundColor: 'rgba(37, 99, 235, 0.2)', borderRadius: '50%', filter: 'blur(80px)' }}></div>

                    <div style={{ position: 'relative', zIndex: 10, maxWidth: '350px', width: '100%' }}>
                        <div style={{
                            backgroundColor: 'rgba(36, 36, 62, 0.5)',
                            backdropFilter: 'blur(12px)',
                            padding: '2rem',
                            borderRadius: '1.5rem',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ position: 'relative', width: '3.5rem', height: '3.5rem', borderRadius: '50%', padding: '2px', border: '2px solid #8b5cf6' }}>
                                    <Image
                                        src="/avatar-1.png"
                                        alt="Sarah M."
                                        width={56}
                                        height={56}
                                        style={{ borderRadius: '50%', objectFit: 'cover', width: '100%', height: '100%' }}
                                    />
                                </div>
                                <div>
                                    <h4 style={{ fontWeight: 'bold', fontSize: '1.125rem', color: 'white' }}>Sarah M.</h4>
                                    <p style={{ color: '#d8b4fe', fontSize: '0.875rem' }}>@SarahM_OF • 142K followers</p>
                                </div>
                                <span style={{ marginLeft: 'auto', backgroundColor: 'rgba(139, 92, 246, 0.2)', color: '#d8b4fe', fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '9999px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                                    Creator
                                </span>
                            </div>

                            <p style={{ color: '#e5e7eb', fontSize: '1.125rem', lineHeight: '1.6', marginBottom: '1rem', fontStyle: 'italic' }}>
                                "I actually LOVE the chat feature OFCharmer offers, so these additional tools will be very useful and helpful 🙏❤️"
                            </p>
                        </div>
                        <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.875rem', marginTop: '1.5rem' }}>Trusted by creators worldwide</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Wrapper for suspense
export default function LoginPage() {
    return (
        <div style={{ backgroundColor: '#05050a', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
            <Suspense fallback={<div style={{ color: 'white' }}>Loading...</div>}>
                <LoginContent />
            </Suspense>
        </div>
    );
}
