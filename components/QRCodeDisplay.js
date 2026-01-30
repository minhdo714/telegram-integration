'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import styles from './QRCodeDisplay.module.css';

export default function QRCodeDisplay({ onSuccess, onError }) {
    const [jobId, setJobId] = useState(null);
    const [qrCode, setQrCode] = useState(null);
    const [status, setStatus] = useState('initializing'); // initializing, qr_ready, scanning, success, expired
    const [countdown, setCountdown] = useState(120); // 2 minutes
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        initiateQRLogin();
    }, []);

    useEffect(() => {
        if (jobId && status === 'qr_ready') {
            const interval = setInterval(() => {
                checkQRStatus();
            }, 2000); // Poll every 2 seconds

            return () => clearInterval(interval);
        }
    }, [jobId, status]);

    useEffect(() => {
        if (status === 'qr_ready' && countdown > 0) {
            const timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        setStatus('expired');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [status, countdown]);

    const initiateQRLogin = async () => {
        try {
            const response = await fetch('/api/accounts/qr-login/initiate', {
                method: 'POST',
            });
            const data = await response.json();

            if (response.ok) {
                setJobId(data.jobId);
                pollForQRCode(data.jobId);
            } else {
                onError(new Error(data.error || 'Failed to initiate login'));
            }
        } catch (error) {
            onError(error);
        }
    };

    const pollForQRCode = async (id) => {
        try {
            const response = await fetch(`/api/accounts/qr-login/status/${id}`);
            const data = await response.json();

            if (data.status === 'qr_generated') {
                setQrCode(data.qrUrl);
                setStatus('qr_ready');
                setLoading(false);
            } else if (data.status === 'pending') {
                setTimeout(() => pollForQRCode(id), 1000);
            } else {
                onError(new Error('Failed to generate QR code'));
            }
        } catch (error) {
            onError(error);
        }
    };

    const checkQRStatus = async () => {
        try {
            const response = await fetch(`/api/accounts/qr-login/check/${jobId}`);
            const data = await response.json();

            if (data.status === 'success') {
                setStatus('success');
                // Complete the login process
                const completeResponse = await fetch(`/api/accounts/qr-login/complete/${jobId}`, {
                    method: 'POST',
                });
                const completeData = await completeResponse.json();

                if (completeResponse.ok) {
                    onSuccess(completeData.account);
                }
            } else if (data.status === 'expired') {
                setStatus('expired');
            }
        } catch (error) {
            // Silently fail for polling errors
            console.error('Polling error:', error);
        }
    };

    const handleRetry = () => {
        setStatus('initializing');
        setCountdown(120);
        setQrCode(null);
        setLoading(true);
        initiateQRLogin();
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className={styles.container}>
            {loading && (
                <div className={styles.loading}>
                    <div className={`${styles.spinner} spin`}>⟳</div>
                    <p>Generating QR code...</p>
                </div>
            )}

            {status === 'qr_ready' && qrCode && (
                <div className={styles.qrDisplay}>
                    <div className={styles.instructions}>
                        <h3>Scan QR Code</h3>
                        <ol>
                            <li>Open <strong>Telegram</strong> on your phone</li>
                            <li>Go to <strong>Settings → Devices</strong></li>
                            <li>Tap <strong>"Link Desktop Device"</strong></li>
                            <li>Scan this QR code</li>
                        </ol>
                    </div>

                    <div className={`${styles.qrWrapper} pulse`}>
                        <QRCodeSVG
                            value={qrCode}
                            size={240}
                            level="M"
                            includeMargin={true}
                            style={{
                                background: 'white',
                                padding: '16px',
                                borderRadius: '12px'
                            }}
                        />
                    </div>

                    <div className={styles.timer}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" />
                            <path d="M8 4V8L11 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        Expires in {formatTime(countdown)}
                    </div>
                </div>
            )}

            {status === 'success' && (
                <div className={styles.success}>
                    <div className={styles.successIcon}>✅</div>
                    <h3>Successfully Scanned!</h3>
                    <p>Completing setup...</p>
                </div>
            )}

            {status === 'expired' && (
                <div className={styles.expired}>
                    <div className={styles.expiredIcon}>⏱️</div>
                    <h3>QR Code Expired</h3>
                    <p>The QR code was not scanned in time.</p>
                    <button className="btn btn-primary mt-md" onClick={handleRetry}>
                        Generate New QR Code
                    </button>
                </div>
            )}
        </div>
    );
}
