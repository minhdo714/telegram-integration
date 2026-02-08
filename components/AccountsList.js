'use client';

import { useEffect, useState } from 'react';
import AccountCard from './AccountCard';
import styles from './AccountsList.module.css';

export default function AccountsList({ onAddAccount }) {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            let userId = document.cookie.split('; ').find(row => row.startsWith('user_id='))?.split('=')[1];
            if (!userId) {
                userId = '1';
            }

            const response = await fetch(`/api/accounts/list?userId=${userId}`);
            const data = await response.json();
            setAccounts(data.accounts || []);
        } catch (error) {
            console.error('Error fetching accounts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnect = async (accountId) => {
        if (!confirm('Are you sure you want to disconnect this account?')) return;

        try {
            let userId = document.cookie.split('; ').find(row => row.startsWith('user_id='))?.split('=')[1];
            if (!userId) userId = '1';

            const response = await fetch(`/api/accounts/delete?id=${accountId}&userId=${userId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setAccounts(accounts.filter(acc => acc.id !== accountId));
            }
        } catch (error) {
            console.error('Error disconnecting account:', error);
        }
    };

    const handleValidate = async (accountId) => {
        try {
            const response = await fetch(`/api/accounts/${accountId}/validate`, {
                method: 'POST',
            });
            const data = await response.json();

            if (response.ok && data.success) {
                // Update account status
                setAccounts(accounts.map(acc =>
                    acc.id === accountId
                        ? { ...acc, sessionStatus: data.status, sessionLastValidated: new Date().toISOString() }
                        : acc
                ));

                // Show feedback to user
                if (data.status === 'valid') {
                    alert('✅ Session is valid and active!');
                } else {
                    alert(`⚠️ Session status: ${data.status}. ${data.message || 'You may need to re-authenticate.'}`);
                }
            } else {
                alert(`❌ Validation failed: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error validating account:', error);
            alert('❌ Network error. Please try again.');
        }
    };

    const handleReLink = async (account) => {
        if (!confirm(`Re-link ${account.telegramUsername || account.phoneNumber}?\n\nThis will disconnect the current session and let you re-authenticate.`)) {
            return;
        }

        try {
            let userId = document.cookie.split('; ').find(row => row.startsWith('user_id='))?.split('=')[1];
            if (!userId) userId = '1';

            // Step 1: Disconnect the account
            const response = await fetch(`/api/accounts/delete?id=${account.id}&userId=${userId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                // Step 2: Remove from local state
                setAccounts(accounts.filter(acc => acc.id !== account.id));

                // Step 3: Open the add account modal
                onAddAccount();

                // Optional: Show success message
                setTimeout(() => {
                    alert(`✅ ${account.telegramUsername || account.phoneNumber} disconnected. Please complete the re-authentication.`);
                }, 500);
            } else {
                alert('❌ Failed to disconnect account. Please try again.');
            }
        } catch (error) {
            console.error('Error re-linking account:', error);
            alert('❌ Network error. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <h2>Your Telegram Accounts</h2>
                </div>
                <div className={styles.grid}>
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`${styles.skeleton} shimmer`} />
                    ))}
                </div>
            </div>
        );
    }

    if (accounts.length === 0) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <h2>Your Telegram Accounts</h2>
                </div>
                <div className={styles.empty}>
                    <div className={styles.emptyIcon}>
                        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                            <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" opacity="0.3" />
                            <path d="M32 24V40M24 32H40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>
                    <h3>No Accounts Connected</h3>
                    <p>Connect your first Telegram account to get started with automation</p>
                    <button className="btn btn-primary mt-md" onClick={onAddAccount}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M10 5V15M5 10H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        Connect Telegram Account
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Your Telegram Accounts</h2>
                <button className="btn btn-secondary" onClick={onAddAccount}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M10 5V15M5 10H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Add Account
                </button>
            </div>
            <div className={styles.grid}>
                {accounts.map(account => (
                    <AccountCard
                        key={account.id}
                        account={account}
                        onDisconnect={handleDisconnect}
                        onValidate={handleValidate}
                        onReLink={handleReLink}
                    />
                ))}
            </div>
        </div>
    );
}
