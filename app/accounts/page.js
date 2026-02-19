'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FiSearch, FiFilter, FiRefreshCw, FiPlus } from 'react-icons/fi';
import DashboardSidebar from '../../components/DashboardSidebar';
import AccountTable from '../../components/AccountTable';
import BulkActionsToolbar from '../../components/BulkActionsToolbar';
import AccountConnectionModal from '../../components/AccountConnectionModal';
import BulkAssignConfigModal from '../../components/BulkAssignConfigModal';
import BulkProxyModal from '../../components/BulkProxyModal';
import AccountDetailDrawer from '../../components/AccountDetailDrawer';

export default function AccountsPage() {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAccounts, setSelectedAccounts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isNewProfileModalOpen, setIsNewProfileModalOpen] = useState(false);
    const [isAssignConfigModalOpen, setIsAssignConfigModalOpen] = useState(false);
    const [isProxyModalOpen, setIsProxyModalOpen] = useState(false);
    const [detailAccount, setDetailAccount] = useState(null);

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            // Get userId from cookies or localStorage (assuming 1 for now)
            const userId = 1;
            const res = await fetch(`/api/accounts/list?userId=${userId}`);
            const data = await res.json();
            if (data.status === 'success') {
                setAccounts(data.accounts);
            }
        } catch (error) {
            toast.error('Failed to load accounts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const filteredAccounts = accounts.filter(acc =>
        acc.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.telegramUsername?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.phoneNumber?.includes(searchQuery)
    );

    const handleBulkUpdate = async (updateData) => {
        try {
            const userId = 1;
            const res = await fetch('/api/accounts/bulk-update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accountIds: selectedAccounts,
                    userId,
                    ...updateData
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                toast.success('Batch update successful');
                fetchAccounts();
                setSelectedAccounts([]);
                setIsProxyModalOpen(false);
                setIsAssignConfigModalOpen(false);
            } else {
                toast.error(data.error || 'Failed to update accounts');
            }
        } catch (error) {
            toast.error('Network error during bulk update');
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedAccounts.length} accounts?`)) return;

        toast.promise(
            Promise.all(selectedAccounts.map(id => fetch(`/api/accounts/${id}?userId=1`, { method: 'DELETE' }))),
            {
                loading: 'Deleting accounts...',
                success: 'Accounts deleted successfully',
                error: 'Failed to delete some accounts',
            }
        ).then(() => {
            fetchAccounts();
            setSelectedAccounts([]);
        });
    };

    const handleAssignConfig = () => {
        setIsAssignConfigModalOpen(true);
    };

    const handleUpdateProxy = () => {
        setIsProxyModalOpen(true);
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#0f0f1e' }}>
            <DashboardSidebar onNewProfile={() => setIsNewProfileModalOpen(true)} />

            <main style={{
                flex: 1,
                marginLeft: '240px',
                padding: '2rem',
                maxWidth: 'calc(100vw - 240px)',
            }}>
                {/* Header Section */}
                <header style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '800', background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.6) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Account Profiles
                            </h1>
                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
                                Manage your Telegram accounts, proxies and AI identities
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => setIsNewProfileModalOpen(true)}
                                className="btn btn-primary"
                                style={{
                                    padding: '0.6rem 1.2rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontSize: '0.9rem'
                                }}
                            >
                                <FiPlus /> Add Account
                            </button>
                            <button onClick={fetchAccounts} className="action-btn">
                                <FiRefreshCw className={loading ? 'spin' : ''} />
                            </button>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div style={{
                        display: 'flex',
                        gap: '1rem',
                        background: 'rgba(26, 26, 46, 0.4)',
                        padding: '0.75rem',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        alignItems: 'center'
                    }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                            <input
                                type="text"
                                placeholder="Search by name, username or phone..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    borderRadius: '8px',
                                    padding: '0.6rem 1rem 0.6rem 2.5rem',
                                    color: 'white',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                }}
                            />
                        </div>

                        <button className="toolbar-btn"><FiFilter /> All Groups</button>
                        <button className="toolbar-btn"><FiSearch /> Filter</button>
                    </div>
                </header>

                <AccountTable
                    accounts={filteredAccounts}
                    selectedAccounts={selectedAccounts}
                    setSelectedAccounts={setSelectedAccounts}
                    onOpen={(id) => window.location.href = `/messages?accountId=${id}`}
                    onSettings={(account) => setDetailAccount(account)}
                    onDelete={(id) => { }}
                    onEdit={(acc) => { }}
                />

                <BulkActionsToolbar
                    selectedCount={selectedAccounts.length}
                    onClearSelection={() => setSelectedAccounts([])}
                    onBulkDelete={handleBulkDelete}
                    onAssignConfig={handleAssignConfig}
                    onUpdateProxy={handleUpdateProxy}
                />
            </main>

            <AccountDetailDrawer
                account={detailAccount}
                onClose={() => setDetailAccount(null)}
                onSaved={fetchAccounts}
            />

            <AccountConnectionModal
                isOpen={isNewProfileModalOpen}
                onClose={() => setIsNewProfileModalOpen(false)}
                onConnected={() => {
                    fetchAccounts();
                    setIsNewProfileModalOpen(false);
                }}
            />

            <BulkAssignConfigModal
                isOpen={isAssignConfigModalOpen}
                onClose={() => setIsAssignConfigModalOpen(false)}
                selectedCount={selectedAccounts.length}
                onAssign={(configId) => handleBulkUpdate({ activeConfigId: configId })}
            />

            <BulkProxyModal
                isOpen={isProxyModalOpen}
                onClose={() => setIsProxyModalOpen(false)}
                selectedCount={selectedAccounts.length}
                onUpdate={(proxyUrl) => handleBulkUpdate({ proxyUrl })}
            />

            <style jsx>{`
                .action-btn {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: white;
                    width: 40px;
                    height: 40px;
                    border-radius: 8px;
                    display: flex;
                    alignItems: center;
                    justifyContent: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .action-btn:hover {
                    background: rgba(255,255,255,0.1);
                    border-color: #00f2fe;
                }
                .toolbar-btn {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: rgba(255,255,255,0.7);
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    display: flex;
                    alignItems: center;
                    gap: 0.5rem;
                    cursor: pointer;
                }
                .toolbar-btn:hover {
                    background: rgba(255,255,255,0.1);
                    color: white;
                }
                .spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
