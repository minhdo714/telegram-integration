'use client';

import { useState } from 'react';
import AccountsList from '@/components/AccountsList';
import AccountConnectionModal from '@/components/AccountConnectionModal';

export default function Home() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleAccountAdded = () => {
        setIsModalOpen(false);
        setRefreshTrigger(prev => prev + 1); // Trigger accounts list refresh
    };

    return (
        <div className="page">
            {/* Hero Section */}
            <section className="hero">
                <div className="container">
                    <div className="hero-content">
                        <h1 className="title">
                            Telegram Account
                            <br />
                            <span className="gradient-text">Integration</span>
                        </h1>
                        <p className="subtitle">
                            Connect your existing Telegram accounts or create new ones.
                            Enjoy seamless automation with session management and health monitoring.
                        </p>
                        <button
                            className="btn btn-primary"
                            onClick={() => setIsModalOpen(true)}
                        >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M10 5V15M5 10H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            Add Telegram Account
                        </button>
                    </div>
                </div>
            </section>

            {/* Accounts Section */}
            <section className="accounts-section">
                <div className="container">
                    <AccountsList key={refreshTrigger} onAddAccount={() => setIsModalOpen(true)} />
                </div>
            </section>

            {/* Modal */}
            {isModalOpen && (
                <AccountConnectionModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={handleAccountAdded}
                />
            )}
        </div>
    );
}
