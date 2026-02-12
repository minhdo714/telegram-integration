'use client';

import { useState } from 'react';
import styles from './AccountCard.module.css';

export default function AccountCard({ account, onDisconnect, onValidate, onReLink, onConfigureAI, onConfigureProxy }) {
    const [isValidating, setIsValidating] = useState(false);
    const [isRelinking, setIsRelinking] = useState(false);

    const getStatusBadge = (status) => {
        const badgeMap = {
            active: { label: 'Active', class: 'success' },
            expired: { label: 'Expired', class: 'error' },
            banned: { label: 'Banned', class: 'error' },
            cooling: { label: 'Cooling', class: 'warning' },
            idle: { label: 'Idle', class: 'info' },
        };
        return badgeMap[status] || badgeMap.idle;
    };

    const getOwnershipBadge = (ownership) => {
        return ownership === 'user_owned'
            ? { label: '🙋 Your Account', class: 'info' }
            : { label: '🤖 System Account', class: 'warning' };
    };

    const formatDate = (date) => {
        const d = new Date(date);
        const now = new Date();
        const diff = now - d;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Today';
        if (days === 1) return '1 day ago';
        if (days < 7) return `${days} days ago`;
        return d.toLocaleDateString();
    };

    const formatTime = (date) => {
        const d = new Date(date);
        const now = new Date();
        const diff = now - d;
        const minutes = Math.floor(diff / (1000 * 60));

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes} min ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        return formatDate(date);
    };

    const handleValidate = async () => {
        setIsValidating(true);
        await onValidate(account.id);
        setIsValidating(false);
    };

    const handleReLink = async () => {
        setIsRelinking(true);
        await onReLink(account);
        setIsRelinking(false);
    };

    const statusBadge = getStatusBadge(account.sessionStatus);
    const ownershipBadge = getOwnershipBadge(account.accountOwnership);
    const dmPercentage = (account.dailyDmSentToday / account.dailyDmQuota) * 100;

    return (
        <div className={`${styles.card} card`}>
            <div className={styles.header}>
                <div className={styles.userInfo}>
                    <div className={styles.avatarLetter} style={{
                        background: `linear-gradient(135deg, hsl(${String(account.id).charCodeAt(0) * 137.5 % 360}, 70%, 60%), hsl(${String(account.id).charCodeAt(0) * 137.5 % 360 + 60}, 70%, 50%))`
                    }}>
                        {account.firstName ? account.firstName[0] : '?'}
                    </div>
                    <div>
                        <h3 className={styles.username}>
                            📱 {account.telegramUsername && account.telegramUsername !== 'unknown'
                                ? `@${account.telegramUsername}`
                                : (account.firstName || account.phoneNumber || 'User')}
                        </h3>
                        <p className={styles.phone}>{account.phoneNumber}</p>
                    </div>
                </div>
                <span className={`badge badge-${statusBadge.class}`}>
                    {account.sessionStatus === 'active' && '✅'}
                    {account.sessionStatus === 'expired' && '⚠️'}
                    {account.sessionStatus === 'banned' && '🚫'}
                    {account.sessionStatus === 'cooling' && '❄️'}
                    {statusBadge.label}
                </span>
            </div>

            <div className={styles.details}>
                <div className={styles.detailRow}>
                    <span className={styles.label}>Type:</span>
                    <span className={`badge badge-${ownershipBadge.class} ${styles.miniBadge}`}>
                        {ownershipBadge.label}
                    </span>
                </div>

                <div className={styles.detailRow}>
                    <span className={styles.label}>AI Persona:</span>
                    <span className={styles.value} style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>
                        {account.activeConfigName || 'Default'}
                    </span>
                </div>

                <div className={styles.detailRow}>
                    <span className={styles.label}>Proxy:</span>
                    <span className={styles.value}>
                        {account.proxyUrl ? '✅ Enabled' : '❌ None'}
                    </span>
                </div>

                <div className={styles.detailRow}>
                    <span className={styles.label}>Integrated:</span>
                    <span className={styles.value}>{formatDate(account.integratedAt)}</span>
                </div>

                {account.sessionLastValidated && (
                    <div className={styles.detailRow}>
                        <span className={styles.label}>Session:</span>
                        <span className={styles.value}>
                            Valid ✓ ({formatTime(account.sessionLastValidated)})
                        </span>
                    </div>
                )}

                {account.dailyDmQuota && (
                    <div className={styles.dmQuota}>
                        <div className={styles.quotaHeader}>
                            <span className={styles.label}>Today's DMs:</span>
                            <span className={styles.value}>
                                {account.dailyDmSentToday}/{account.dailyDmQuota}
                            </span>
                        </div>
                        <div className={styles.progressBar}>
                            <div
                                className={styles.progressFill}
                                style={{ width: `${dmPercentage}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className={styles.actions}>
                {/* Primary Action - Configure AI */}
                <button
                    onClick={() => onConfigureAI(account.id)}
                    className={`btn btn-primary ${styles.primaryBtn}`}
                >
                    🤖 Configure AI
                </button>

                {/* Secondary Actions */}
                <div className={styles.secondaryActions}>
                    <button
                        className={`btn btn-ghost ${styles.secondaryBtn}`}
                        onClick={() => onConfigureProxy(account)}
                        title="Proxy Settings"
                    >
                        🛡️
                    </button>

                    <button
                        className={`btn btn-ghost ${styles.secondaryBtn}`}
                        onClick={handleValidate}
                        disabled={isValidating}
                        title="Check session health"
                    >
                        {isValidating ? (
                            <span className="spin">⟳</span>
                        ) : (
                            '🔍'
                        )}
                    </button>

                    <button
                        className={`btn btn-ghost ${styles.secondaryBtn}`}
                        onClick={handleReLink}
                        disabled={isRelinking}
                        title="Re-authenticate this account"
                    >
                        {isRelinking ? (
                            <span className="spin">⟳</span>
                        ) : (
                            '🔄'
                        )}
                    </button>

                    <button
                        className={`btn btn-ghost ${styles.secondaryBtn}`}
                        onClick={() => onDisconnect(account.id)}
                        title="Disconnect account"
                    >
                        🔌
                    </button>
                </div>
            </div>
        </div>
    );
}
