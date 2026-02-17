'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import QRCodeDisplay from './QRCodeDisplay';
import PhoneInput from './PhoneInput';
import CodeVerification from './CodeVerification';
import styles from './AccountConnectionModal.module.css';

export default function AccountConnectionModal({ isOpen, onClose, onSuccess }) {
    const [activeTab, setActiveTab] = useState('qr'); // 'qr', 'sms', 'bulk'
    const [smsStep, setSmsStep] = useState('phone'); // 'phone', 'code', '2fa', 'success'
    const [sessionId, setSessionId] = useState(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [phoneHash, setPhoneHash] = useState('');
    const [sessionString, setSessionString] = useState('');
    const [bulkStrings, setBulkStrings] = useState('');
    const [importResults, setImportResults] = useState(null);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleBulkImport = async () => {
        const strings = bulkStrings.split('\n').map(s => s.trim()).filter(s => s.length > 50);
        if (strings.length === 0) {
            toast.error('Please enter valid session strings (one per line)');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/accounts/bulk-import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_strings: strings
                }),
            });

            const data = await response.json();
            if (response.ok) {
                setImportResults(data);
                toast.success(`Successfully imported ${data.success} accounts!`);
                if (data.success > 0) {
                    onSuccess();
                }
            } else {
                toast.error(data.error || 'Failed to import accounts');
            }
        } catch (error) {
            toast.error('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleQRSuccess = async (accountData) => {
        toast.success('Account connected!');
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
                console.log('DEBUG: SMS Code Request Success:', data);
                setPhoneNumber(phone);
                setPhoneHash(data.phoneHash || data.phone_hash);
                setSessionString(data.sessionString || data.session_string);
                setSessionId(data.sessionId || data.session_id);
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
        console.log('DEBUG: Verifying code:', code);
        console.log('DEBUG: State - phone:', phoneNumber, 'hash:', !!phoneHash, 'session:', !!sessionString);

        if (!phoneNumber || !phoneHash) {
            toast.error('Session data lost. Please try again.');
            setSmsStep('phone');
            return;
        }

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
                    setSmsStep('success');
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
                body: JSON.stringify({
                    phoneNumber,
                    password,
                    sessionString
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSmsStep('success');
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
                        QR Code
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'sms' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('sms')}
                    >
                        <span>📱</span>
                        Phone
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'bulk' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('bulk')}
                    >
                        <span>⚡</span>
                        Bulk Import
                    </button>
                </div>

                <div className={styles.content}>
                    {activeTab === 'qr' && (
                        <QRCodeDisplay
                            onSuccess={handleQRSuccess}
                            onError={(error) => toast.error(error.message)}
                        />
                    )}

                    {activeTab === 'sms' && (
                        <div className={styles.smsFlow}>
                            {smsStep === 'phone' && (
                                <PhoneInput
                                    onSubmit={handleSendCode}
                                    loading={loading}
                                    initialValue="+1"
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
                            {smsStep === 'success' && (
                                <div className={styles.successStep}>
                                    <div className={styles.stepIcon}>✅</div>
                                    <h3>Account Linked!</h3>
                                    <button
                                        className="btn btn-primary"
                                        style={{ width: '100%', marginTop: '24px' }}
                                        onClick={onClose}
                                    >
                                        Done
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'bulk' && (
                        <div className={styles.bulkImport}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                    Paste <strong>String Sessions</strong> (one per line). <br />
                                    <strong>Mandatory Format:</strong> <code>session_string|proxy_url</code><br />
                                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Example: <code>1BXYZ...|socks5://user:pass@65.123.45.67:8080</code></span>
                                </p>
                                <textarea
                                    placeholder="1BXYZ...|socks5://user:pass@host:port&#10;1AHPQ...|socks5://user:pass@host:port&#10;..."
                                    value={bulkStrings}
                                    onChange={(e) => setBulkStrings(e.target.value)}
                                    disabled={loading}
                                    style={{ minHeight: '220px' }}
                                />
                                <p style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '11px', fontStyle: 'italic' }}>
                                    Every account must have its own proxy to prevent mass flagging.
                                </p>
                            </div>

                            {importResults && (
                                <div className={styles.importResults}>
                                    <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                                        Results: {importResults.success} success, {importResults.failed} failed
                                    </p>
                                    <div className={styles.resultList}>
                                        {importResults.details.map((res, i) => (
                                            <div key={i} className={`${styles.resultItem} ${res.status === 'success' ? styles.resultSuccess : styles.resultError}`}>
                                                {res.status === 'success' ? '✅' : '❌'} {res.username || (res.error?.length > 40 ? res.error.substring(0, 40) + '...' : res.error)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button
                                className="btn btn-primary"
                                onClick={handleBulkImport}
                                disabled={loading || !bulkStrings.trim() || !bulkStrings.includes('|')}
                                style={{ width: '100%', marginTop: '0.5rem' }}
                            >
                                {loading ? 'Importing Batch...' : 'Import Accounts with Mandatory Proxies'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
