'use client';

import { useState, useEffect } from 'react';
import styles from './MessageComposer.module.css';

export default function MessageComposer({ onClose, onSuccess }) {
    const [accounts, setAccounts] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState('');
    const [recipient, setRecipient] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            let userId = document.cookie.split('; ').find(row => row.startsWith('user_id='))?.split('=')[1];
            if (!userId) userId = '1';

            const response = await fetch(`/api/accounts/list?userId=${userId}`);
            const data = await response.json();
            const activeAccounts = (data.accounts || []).filter(acc => acc.sessionStatus === 'valid' || acc.sessionStatus === 'active');
            setAccounts(activeAccounts);

            // Auto-select first account
            if (activeAccounts.length > 0) {
                setSelectedAccount(activeAccounts[0].id.toString());
            }
        } catch (error) {
            console.error('Error fetching accounts:', error);
            setError('Failed to load accounts');
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();

        if (!selectedAccount) {
            setError('Please select an account');
            return;
        }
        if (!recipient.trim()) {
            setError('Please enter a recipient');
            return;
        }
        if (!message.trim()) {
            setError('Please enter a message');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/messages/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accountId: selectedAccount,
                    recipient: recipient.trim(),
                    message: message.trim()
                }),
            });

            const data = await response.json();

            if (response.ok && data.status === 'success') {
                alert(`✅ Message sent successfully to ${data.sent_to}!`);
                setRecipient('');
                setMessage('');
                if (onSuccess) onSuccess(data);
            } else {
                // Handle specific error types
                let errorMsg = data.message || 'Failed to send message';
                if (data.error_type === 'user_not_found') {
                    errorMsg = `User "${recipient}" not found. Check the username or phone number.`;
                } else if (data.error_type === 'blocked') {
                    errorMsg = 'Cannot send message - you may be blocked or privacy settings prevent it.';
                } else if (data.error_type === 'rate_limited') {
                    errorMsg = `Rate limited. Please wait ${data.retry_after || 60} seconds before trying again.`;
                } else if (data.error_type === 'session_invalid') {
                    errorMsg = 'Session expired. Please reconnect your account.';
                }
                setError(errorMsg);
            }
        } catch (error) {
            console.error('Send error:', error);
            setError('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    const characterCount = message.length;
    const isOverLimit = characterCount > 4096;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>Send Direct Message</h2>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Close">×</button>
                </div>

                {accounts.length === 0 ? (
                    <div className={styles.empty}>
                        <p>No active accounts found. Please connect a Telegram account first.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSend} className={styles.form}>
                        <div className={styles.field}>
                            <label htmlFor="account">From Account:</label>
                            <select
                                id="account"
                                value={selectedAccount}
                                onChange={(e) => setSelectedAccount(e.target.value)}
                                className={styles.select}
                                required
                            >
                                {accounts.map(account => (
                                    <option key={account.id} value={account.id}>
                                        {account.username ? `@${account.username}` : account.firstName || account.phone}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="recipient">To:</label>
                            <input
                                id="recipient"
                                type="text"
                                placeholder="@username or phone number"
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                                className={styles.input}
                                required
                            />
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="message">Message:</label>
                            <textarea
                                id="message"
                                placeholder="Type your message..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className={styles.textarea}
                                rows="6"
                                required
                            />
                            <div className={`${styles.charCount} ${isOverLimit ? styles.error : ''}`}>
                                {characterCount} / 4096 characters
                            </div>
                        </div>

                        {error && (
                            <div className={styles.errorMsg}>
                                {error}
                            </div>
                        )}

                        <div className={styles.actions}>
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || isOverLimit || !selectedAccount}
                                className="btn btn-primary"
                            >
                                {loading ? 'Sending...' : 'Send Message →'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
