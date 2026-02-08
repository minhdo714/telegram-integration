'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import QRCodeDisplay from './QRCodeDisplay';
import PhoneInput from './PhoneInput';
import CodeVerification from './CodeVerification';
import styles from './AccountConnectionModal.module.css';

export default function AccountConnectionModal({ isOpen, onClose, onSuccess }) {
    const [activeTab, setActiveTab] = useState('qr'); // 'qr' or 'sms'
    const [smsStep, setSmsStep] = useState('phone'); // 'phone', 'code', '2fa'
    const [sessionId, setSessionId] = useState(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [phoneHash, setPhoneHash] = useState('');
    const [sessionString, setSessionString] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleQRSuccess = async (accountData) => {
        toast.success('Account connected successfully!');
        onSuccess(accountData);
    };

    const handleSendCode = async (phone) => {
        setLoading(true);
        try {
            const response = await fetch('/api/accounts/sms-login/request-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber: phone }),
            });

            const data = await response.json();

            if (response.ok) {
                setPhoneNumber(phone);
                setPhoneHash(data.phoneHash);
                setSessionString(data.sessionString);
                setSessionId(data.sessionId);
                setSmsStep('code');
                toast.success('Code sent to your phone!');
            } else {
                toast.error(data.error || 'Failed to send code');
            }
        } catch (error) {
            toast.error('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async (code) => {
        setLoading(true);
        try {
            const response = await fetch('/api/accounts/sms-login/verify-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phoneNumber,
                    code,
                    phoneHash,
                    sessionString
                }),
            });

            const data = await response.json();

            if (response.ok) {
                if (data.needs2FA) {
                    setSmsStep('2fa');
                    toast('2FA required. Please enter your password.');
                } else {
                    toast.success('Account connected successfully!');
                    onSuccess(data.account);
                }
            } else {
                toast.error(data.error || 'Invalid code');
            }
        } catch (error) {
            toast.error('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify2FA = async (password) => {
        setLoading(true);
        try {
            const response = await fetch('/api/accounts/sms-login/verify-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, password }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Account connected successfully!');
                onSuccess(data.account);
            } else {
                toast.error(data.error || 'Invalid password');
            }
        } catch (error) {
            toast.error('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onClick={handleBackdropClick}>
            <div className={`modal ${styles.modal}`}>
                <div className={styles.header}>
                    <h2>Connect Telegram Account</h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'qr' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('qr')}
                    >
                        <span>📲</span>
                        QR Code Login
                        <span className={styles.recommended}>Recommended</span>
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'sms' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('sms')}
                    >
                        <span>📱</span>
                        Phone Number
                    </button>
                </div>

                <div className={styles.content}>
                    {activeTab === 'qr' ? (
                        <QRCodeDisplay
                            onSuccess={handleQRSuccess}
                            onError={(error) => toast.error(error.message)}
                        />
                    ) : (
                        <div className={styles.smsFlow}>
                            {smsStep === 'phone' && (
                                <PhoneInput
                                    onSubmit={handleSendCode}
                                    loading={loading}
                                />
                            )}

                            {smsStep === 'code' && (
                                <CodeVerification
                                    phoneNumber={phoneNumber}
                                    onVerify={handleVerifyCode}
                                    onResend={() => handleSendCode(phoneNumber)}
                                    loading={loading}
                                />
                            )}

                            {smsStep === '2fa' && (
                                <div className={styles.twoFAStep}>
                                    <div className={styles.stepIcon}>🔒</div>
                                    <h3>Two-Factor Authentication</h3>
                                    <p>This account has 2-step verification enabled.</p>
                                    <form onSubmit={(e) => {
                                        e.preventDefault();
                                        const password = e.target.password.value;
                                        if (password) handleVerify2FA(password);
                                    }}>
                                        <input
                                            type="password"
                                            name="password"
                                            className="input"
                                            placeholder="Enter 2FA password"
                                            autoFocus
                                            required
                                        />
                                        <div className={styles.formActions}>
                                            <button type="button" className="btn btn-ghost" onClick={() => setSmsStep('phone')}>
                                                Back
                                            </button>
                                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                                {loading ? 'Verifying...' : 'Login'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
