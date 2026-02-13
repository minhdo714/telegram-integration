'use client';

import { FiSettings, FiGlobe, FiTrash2, FiX } from 'react-icons/fi';

export default function BulkActionsToolbar({
    selectedCount,
    onAssignConfig,
    onUpdateProxy,
    onBulkDelete,
    onClearSelection
}) {
    if (selectedCount === 0) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(26, 26, 46, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 242, 254, 0.3)',
            borderRadius: '100px',
            padding: '0.75rem 2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 242, 254, 0.1)',
            zIndex: 1000,
            animation: 'slideUp 0.3s ease',
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                paddingRight: '1.5rem',
                borderRight: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
                <span style={{
                    background: '#00f2fe',
                    color: '#0f0f1e',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                }}>
                    {selectedCount}
                </span>
                <span style={{ color: 'white', fontSize: '0.9rem', fontWeight: '500' }}>Selected</span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                    onClick={onAssignConfig}
                    className="bulk-btn"
                    title="Assign AI Config"
                >
                    <FiSettings /> Assign AI Config
                </button>
                <button
                    onClick={onUpdateProxy}
                    className="bulk-btn"
                    title="Update Proxy"
                >
                    <FiGlobe /> Bulk Proxy
                </button>
                <button
                    onClick={onBulkDelete}
                    className="bulk-btn bulk-btn-danger"
                    title="Delete All"
                >
                    <FiTrash2 /> Delete
                </button>
            </div>

            <button
                onClick={onClearSelection}
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.4)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                }}
            >
                <FiX />
            </button>

            <style jsx>{`
                .bulk-btn {
                    background: rgba(255, 255, 255, 0.05);
                    color: white;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    padding: 0.5rem 1rem;
                    font-size: 0.85rem;
                    font-weight: 500;
                    cursor: pointer;
                    display: flex;
                    alignItems: center;
                    gap: 0.5rem;
                    transition: all 0.2s;
                }
                .bulk-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: #00f2fe;
                }
                .bulk-btn-danger:hover {
                    background: rgba(245, 87, 108, 0.1);
                    border-color: #f5576c;
                    color: #f5576c;
                }
                @keyframes slideUp {
                    from { transform: translate(-50%, 100px); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
