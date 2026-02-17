import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata = {
    title: 'OFCharmer - AI Chatbot for OnlyFans & Fansly Creators',
    description: 'Turn Telegram DMs into paying fans. AI-powered chatbot that talks like you, sends photos, and converts to PPV sales 24/7.',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                {children}
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: '#1a1a2e',
                            color: '#fff',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            padding: '16px',
                            zIndex: 99999,
                        },
                        success: {
                            iconTheme: {
                                primary: '#00f2fe',
                                secondary: '#1a1a2e',
                            },
                        },
                        error: {
                            iconTheme: {
                                primary: '#f5576c',
                                secondary: '#1a1a2e',
                            },
                        },
                    }}
                />
            </body>
        </html>
    );
}
