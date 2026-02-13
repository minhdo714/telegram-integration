'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    FiUsers,
    FiGlobe,
    FiLayers,
    FiPlus,
    FiSettings,
    FiMessageSquare
} from 'react-icons/fi';

export default function DashboardSidebar({ onNewProfile }) {
    const pathname = usePathname();

    const menuItems = [
        { id: 'profiles', label: 'Tele Accounts', icon: <FiUsers />, href: '/accounts' },
        { id: 'groups', label: 'Groups', icon: <FiLayers />, href: '/groups' },
        { id: 'proxies', label: 'Proxies', icon: <FiGlobe />, href: '/proxies' },
        { id: 'ai-config', label: 'Config AI', icon: <FiSettings />, href: '/config' },
        { id: 'messages', label: 'Messages', icon: <FiMessageSquare />, href: '/messages' },
    ];

    return (
        <aside style={{
            width: '240px',
            background: '#1a1a2e',
            height: '100vh',
            borderRight: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            padding: '1.5rem 1rem',
            position: 'fixed',
            left: 0,
            top: 0,
            zIndex: 100,
        }}>
            {/* New Profile Button */}
            <button
                onClick={onNewProfile}
                style={{
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                    marginBottom: '2rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(0, 242, 254, 0.3)',
                    transition: 'transform 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
                <span>New Profile</span>
                <FiPlus style={{
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '4px',
                    padding: '2px',
                    fontSize: '1.2rem'
                }} />
            </button>

            {/* Menu Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem 1rem',
                                borderRadius: '8px',
                                color: isActive ? 'white' : 'rgba(255, 255, 255, 0.6)',
                                background: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                                textDecoration: 'none',
                                fontSize: '0.95rem',
                                fontWeight: isActive ? '600' : '400',
                                transition: 'all 0.2s',
                            }}
                            onMouseOver={(e) => !isActive && (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)')}
                            onMouseOut={(e) => !isActive && (e.currentTarget.style.background = 'transparent')}
                        >
                            <span style={{ fontSize: '1.1rem', display: 'flex' }}>{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </div>

            {/* Bottom Section */}
            <div style={{ marginTop: 'auto', padding: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>
                    v1.2.0-stable
                </div>
            </div>
        </aside>
    );
}
