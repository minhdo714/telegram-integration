// Mock QR code generation (in production, this would be handled by Telethon worker)
export function generateMockQRCode() {
    // Returns a base64 placeholder or a data URL
    // In production, the worker would generate this via Telethon
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=tg://login?token=${Math.random().toString(36).substring(7)}`;
}

// Simulate QR code scan detection
export function simulateQRScan(jobId, timeout = 120000) {
    return new Promise((resolve, reject) => {
        // Simulate user scanning within 30-90 seconds
        const scanTime = Math.random() * 60000 + 30000;

        if (scanTime > timeout) {
            setTimeout(() => reject(new Error('QR code expired')), timeout);
        } else {
            setTimeout(() => {
                resolve({
                    scanned: true,
                    user: {
                        id: Math.floor(Math.random() * 1000000000),
                        phone: `+1-555-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
                        username: `user${Math.floor(Math.random() * 10000)}`,
                        firstName: 'Demo',
                        lastName: 'User',
                    },
                });
            }, scanTime);
        }
    });
}

// Simulate SMS code sending
export function simulateSendSMSCode(phoneNumber) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                success: true,
                phoneHash: Math.random().toString(36).substring(7),
                code: '12345', // In dev, we know the code
            });
        }, 1000);
    });
}

// Simulate code verification
export function simulateVerifyCode(phoneNumber, code, phoneHash) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (code === '12345') {
                // 30% chance of requiring 2FA for demo purposes
                const needs2FA = Math.random() > 0.7;

                if (needs2FA) {
                    resolve({
                        success: true,
                        needs2FA: true,
                    });
                } else {
                    resolve({
                        success: true,
                        needs2FA: false,
                        user: {
                            id: Math.floor(Math.random() * 1000000000),
                            phone: phoneNumber,
                            username: `user${Math.floor(Math.random() * 10000)}`,
                            firstName: 'Demo',
                            lastName: 'User',
                        },
                    });
                }
            } else {
                reject(new Error('Invalid code'));
            }
        }, 1000);
    });
}

// Simulate 2FA password verification
export function simulateVerify2FA(password) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (password.length > 0) {
                resolve({
                    success: true,
                    user: {
                        id: Math.floor(Math.random() * 1000000000),
                        phone: `+1-555-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
                        username: `user${Math.floor(Math.random() * 10000)}`,
                        firstName: 'Demo',
                        lastName: 'User',
                    },
                });
            } else {
                reject(new Error('Invalid password'));
            }
        }, 1000);
    });
}
