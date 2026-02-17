'use client';

import { useState } from 'react';
import styles from './PhoneInput.module.css';

export default function PhoneInput({ onSubmit, loading, initialValue = '' }) {
    const [phone, setPhone] = useState(initialValue);
    const [error, setError] = useState('');

    const validatePhone = (value) => {
        // Basic E.164 format validation
        const phoneRegex = /^\+\d{1,3}\d{6,14}$/;
        return phoneRegex.test(value.replace(/[\s-]/g, ''));
    };

    const formatPhone = (value) => {
        // Remove all non-digit characters except +
        return value.replace(/[^\d+]/g, '');
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const formattedPhone = formatPhone(phone);

        if (!formattedPhone.startsWith('+')) {
            setError('Phone number must start with + and country code');
            return;
        }

        if (!validatePhone(formattedPhone)) {
            setError('Please enter a valid international phone number');
            return;
        }

        setError('');
        onSubmit(formattedPhone);
    };

    const handleChange = (e) => {
        const value = e.target.value;
        setPhone(value);
        if (error) setError('');
    };

    return (
        <div className={styles.container}>
            <div className={styles.icon}>📱</div>
            <h3>Enter Your Phone Number</h3>
            <p>We'll send you a verification code via SMS</p>

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.inputWrapper}>
                    <input
                        type="tel"
                        className={`input ${error ? styles.inputError : ''}`}
                        placeholder="+1-555-123-4567"
                        value={phone}
                        onChange={handleChange}
                        autoFocus
                        required
                    />
                    {error && <p className={styles.error}>{error}</p>}
                </div>

                <div className={styles.hint}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M8 7V11M8 5V5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    Format: +[country code][phone number] (e.g., +1-555-123-4567)
                </div>

                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || !phone}
                >
                    {loading ? (
                        <>
                            <span className="spin">⟳</span>
                            Sending Code...
                        </>
                    ) : (
                        'Send Code'
                    )}
                </button>
            </form>
        </div>
    );
}
