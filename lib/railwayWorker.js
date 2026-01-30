// Railway Worker API client for Telethon operations

const WORKER_URL = process.env.RAILWAY_WORKER_URL;

// Initiate QR code login
export async function initiateQRLogin() {
    try {
        const response = await fetch(`${WORKER_URL}/api/qr-login/initiate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to initiate QR login');
        }

        return await response.json();
    } catch (error) {
        console.error('Error initiating QR login:', error);
        throw error;
    }
}

// Check QR login status
export async function checkQRLoginStatus(jobId) {
    try {
        const response = await fetch(`${WORKER_URL}/api/qr-login/status/${jobId}`);

        if (!response.ok) {
            throw new Error('Failed to check QR login status');
        }

        return await response.json();
    } catch (error) {
        console.error('Error checking QR login status:', error);
        throw error;
    }
}

// Initiate SMS login
export async function initiateSMSLogin(phoneNumber) {
    try {
        const response = await fetch(`${WORKER_URL}/api/sms-login/request-code`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ phoneNumber }),
        });

        if (!response.ok) {
            throw new Error('Failed to request SMS code');
        }

        return await response.json();
    } catch (error) {
        console.error('Error initiating SMS login:', error);
        throw error;
    }
}

// Verify SMS code
export async function verifySMSCode(phoneNumber, code, phoneHash) {
    try {
        const response = await fetch(`${WORKER_URL}/api/sms-login/verify-code`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ phoneNumber, code, phoneHash }),
        });

        if (!response.ok) {
            throw new Error('Failed to verify SMS code');
        }

        return await response.json();
    } catch (error) {
        console.error('Error verifying SMS code:', error);
        throw error;
    }
}

// Verify 2FA password
export async function verify2FA(phoneNumber, password) {
    try {
        const response = await fetch(`${WORKER_URL}/api/sms-login/verify-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ phoneNumber, password }),
        });

        if (!response.ok) {
            throw new Error('Failed to verify 2FA password');
        }

        return await response.json();
    } catch (error) {
        console.error('Error verifying 2FA:', error);
        throw error;
    }
}

// Validate session
export async function validateSession(accountId) {
    try {
        const response = await fetch(`${WORKER_URL}/api/validate-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ accountId }),
        });

        if (!response.ok) {
            throw new Error('Failed to validate session');
        }

        return await response.json();
    } catch (error) {
        console.error('Error validating session:', error);
        throw error;
    }
}
