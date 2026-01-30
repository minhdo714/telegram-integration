'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './CodeVerification.module.css';

export default function CodeVerification({ phoneNumber, onVerify, onResend, loading }) {
    const [code, setCode] = useState(['', '', '', '', '']);
    const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef()];
    const [canResend, setCanResend] = useState(false);
    const [resendCountdown, setResendCountdown] = useState(60);

    useEffect(() => {
        if (resendCountdown > 0) {
            const timer = setTimeout(() => setResendCountdown(prev => prev - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [resendCountdown]);

    useEffect(() => {
        // Auto-submit when all digits are filled
        if (code.every(digit => digit !== '')) {
            onVerify(code.join(''));
        }
    }, [code]);

    const handleChange = (index, value) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        // Auto-focus next input
        if (value && index < 4) {
            inputRefs[index + 1].current.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        // Handle backspace
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs[index - 1].current.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');

        if (pastedData.length === 5) {
            setCode(pastedData.split(''));
            inputRefs[4].current.focus();
        }
    };

    const handleResend = () => {
        setCanResend(false);
        setResendCountdown(60);
        onResend();
    };

    return (
        <div className={styles.container}>
            <div className={styles.icon}>✉️</div>
            <h3>Enter Verification Code</h3>
            <p>We sent a code to <strong>{phoneNumber}</strong></p>

            <div className={styles.codeInputs}>
                {code.map((digit, index) => (
                    <input
                        key={index}
                        ref={inputRefs[index]}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        className={styles.codeInput}
                        value={digit}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        autoFocus={index === 0}
                    />
                ))}
            </div>

            {loading && (
                <div className={styles.loading}>
                    <span className="spin">⟳</span> Verifying...
                </div>
            )}

            <div className={styles.resendSection}>
                {canResend ? (
                    <button
                        type="button"
                        className={styles.resendBtn}
                        onClick={handleResend}
                    >
                        Didn't receive code? <strong>Resend</strong>
                    </button>
                ) : (
                    <p className={styles.resendWait}>
                        Resend code in {resendCountdown}s
                    </p>
                )}
            </div>
        </div>
    );
}
