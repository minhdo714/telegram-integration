
'use client';

import { useState, useEffect } from 'react';
import styles from './ProxySettingsModal.module.css';

export default function ProxySettingsModal({ isOpen, onClose, account, onSave }) {
    const [proxyUrl, setProxyUrl] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && account) {
            setProxyUrl(account.proxyUrl || '');
        }
    }, [isOpen, account]);

    const handleSave = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/accounts/${account.id}/proxy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ proxyUrl: proxyUrl.trim() || null })
            });

            if (response.ok) {
                onSave();
                onClose();
            } else {
                alert("Failed to save proxy settings");
            }
        } catch (error) {
            console.error("Error saving proxy", error);
            alert("Network error");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>🛡️ Proxy Settings</h2>
                    <button onClick={onClose} className={styles.closeBtn}>&times;</button>
                </div>

                <div className={styles.content}>
                    <p className={styles.info}>
                        Assign a proxy to this account to prevent Telegram from flagging it.
                        Supports HTTP, SOCKS4, and SOCKS5.
                    </p>

                    <div className={styles.formGroup}>
                        <label>Proxy URL</label>
                        <input
                            type="text"
                            placeholder="http://user:pass@host:port"
                            value={proxyUrl}
                            onChange={(e) => setProxyUrl(e.target.value)}
                            className={styles.input}
                        />
                        <p className={styles.hint}>
                            Formats:<br />
                            <code>http://user:pass@1.2.3.4:8080</code><br />
                            <code>socks5://1.2.3.4:1080</code>
                        </p>
                    </div>

                    <div className={styles.actions}>
                        <button onClick={onClose} className="btn btn-secondary">Cancel</button>
                        <button onClick={handleSave} disabled={loading} className="btn btn-primary">
                            {loading ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
