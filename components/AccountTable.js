'use client';

import { useState } from 'react';
import { FiEdit2, FiTrash2, FiExternalLink, FiMoreVertical, FiCheckSquare, FiSquare } from 'react-icons/fi';

export default function AccountTable({
    accounts,
    onEdit,
    onDelete,
    onOpen,
    selectedAccounts,
    setSelectedAccounts
}) {
    const toggleSelectAll = () => {
        if (selectedAccounts.length === accounts.length) {
            setSelectedAccounts([]);
        } else {
            setSelectedAccounts(accounts.map(a => a.id));
        }
    };

    const toggleSelect = (id) => {
        if (selectedAccounts.includes(id)) {
            setSelectedAccounts(selectedAccounts.filter(aid => aid !== id));
        } else {
            setSelectedAccounts([...selectedAccounts, id]);
        }
    };

    return (
        <div style={{
            background: 'rgba(26, 26, 46, 0.4)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            overflow: 'hidden',
            width: '100%',
        }}>
            <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '0.9rem',
            }}>
                <thead>
                    <tr style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        background: 'rgba(255, 255, 255, 0.02)',
                    }}>
                        <th style={{ padding: '1rem' }}>
                            <button
                                onClick={toggleSelectAll}
                                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex' }}
                            >
                                {selectedAccounts.length === accounts.length && accounts.length > 0 ? <FiCheckSquare color="#00f2fe" /> : <FiSquare />}
                            </button>
                        </th>
                        <th style={{ padding: '1rem', color: 'rgba(255,255,255,0.5)', fontWeight: '500' }}>No./ID</th>
                        <th style={{ padding: '1rem', color: 'rgba(255,255,255,0.5)', fontWeight: '500' }}>Name</th>
                        <th style={{ padding: '1rem', color: 'rgba(255,255,255,0.5)', fontWeight: '500' }}>Proxies (IP)</th>
                        <th style={{ padding: '1rem', color: 'rgba(255,255,255,0.5)', fontWeight: '500' }}>Group</th>
                        <th style={{ padding: '1rem', color: 'rgba(255,255,255,0.5)', fontWeight: '500' }}>AI Config</th>
                        <th style={{ padding: '1rem', color: 'rgba(255,255,255,0.5)', fontWeight: '500' }}>Status</th>
                        <th style={{ padding: '1rem', color: 'rgba(255,255,255,0.5)', fontWeight: '500', textAlign: 'right' }}>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {accounts.map((account, index) => {
                        const isSelected = selectedAccounts.includes(account.id);
                        return (
                            <tr
                                key={account.id}
                                style={{
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.02)',
                                    background: isSelected ? 'rgba(0, 242, 254, 0.05)' : 'transparent',
                                    transition: 'background 0.2s',
                                }}
                            >
                                <td style={{ padding: '1rem' }}>
                                    <button
                                        onClick={() => toggleSelect(account.id)}
                                        style={{ background: 'none', border: 'none', color: isSelected ? '#00f2fe' : 'rgba(255,255,255,0.2)', cursor: 'pointer', display: 'flex' }}
                                    >
                                        {isSelected ? <FiCheckSquare /> : <FiSquare />}
                                    </button>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontSize: '0.85rem', color: 'white' }}>{index + 1}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>{account.id}</div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: '600', color: '#4facfe' }}>
                                        {account.firstName} {account.lastName}
                                        <FiEdit2 style={{ marginLeft: '4px', fontSize: '0.7rem', opacity: 0.5 }} />
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>@{account.telegramUsername}</div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ color: '#00f2fe', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        {account.proxyUrl || 'No Proxy'}
                                        {account.proxyUrl && <FiEdit2 style={{ fontSize: '0.7rem', opacity: 0.5 }} />}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>HTTP/SOCKS5</div>
                                </td>
                                <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.7)' }}>
                                    {account.niche || 'General'}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{
                                        background: account.activeConfigId ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.05)',
                                        color: account.activeConfigId ? '#6366f1' : 'rgba(255,255,255,0.3)',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        display: 'inline-block',
                                        border: account.activeConfigId ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent'
                                    }}>
                                        {account.activeConfigName || 'Not Set'}
                                    </div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: account.sessionStatus === 'active' ? '#00f2fe' : '#f5576c'
                                        }} />
                                        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{account.sessionStatus}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                        <button
                                            onClick={() => onOpen(account.id)}
                                            style={{
                                                background: '#4facfe',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                padding: '4px 12px',
                                                fontSize: '0.8rem',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                        >
                                            Open <FiExternalLink />
                                        </button>
                                        <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                                            <FiMoreVertical />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {accounts.length === 0 && (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                    No accounts found. Click "New Profile" to add one.
                </div>
            )}
        </div>
    );
}
