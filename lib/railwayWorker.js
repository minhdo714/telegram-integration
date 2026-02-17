// Railway Worker API client for Telethon operations

import { WORKER_URL } from './worker-url';

async function fetchJSON(path, options = {}) {
    const url = path.startsWith('http') ? path : `${WORKER_URL}${path}`;
    console.log(`WORKER_CALL: ${options.method || 'GET'} ${url}`);

    try {
        const response = await fetch(url, options);
        const text = await response.text();

        try {
            const data = JSON.parse(text);
            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }
            return data;
        } catch (e) {
            console.error(`Failed to parse JSON from ${url}. Status: ${response.status}`);
            console.error(`Response start: ${text.substring(0, 100)}`);
            throw new Error(`Invalid response from worker (${response.status}): ${text.substring(0, 50)}...`);
        }
    } catch (error) {
        console.error(`Fetch error for ${url}:`, error.message);
        throw error;
    }
}

// Initiate QR code login
export async function initiateQRLogin() {
    try {
        return await fetchJSON('/api/qr-login/initiate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        console.error('Error initiating QR login:', error);
        throw error;
    }
}

// Check QR login status
export async function checkQRLoginStatus(jobId) {
    try {
        return await fetchJSON(`/api/qr-login/status/${jobId}`);
    } catch (error) {
        console.error('Error checking QR login status:', error);
        throw error;
    }
}

// Initiate SMS login
export async function initiateSMSLogin(phoneNumber, sessionString = null) {
    try {
        return await fetchJSON('/api/sms-login/request-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ phoneNumber, sessionString }),
        });
    } catch (error) {
        console.error('Error initiating SMS login:', error);
        throw error;
    }
}

// Verify SMS code
export async function verifySMSCode(phoneNumber, code, phoneHash, sessionString) {
    try {
        return await fetchJSON('/api/sms-login/verify-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ phoneNumber, code, phoneHash, sessionString }),
        });
    } catch (error) {
        console.error('Error verifying SMS code:', error);
        throw error;
    }
}

// Verify 2FA password
export async function verify2FA(phoneNumber, password, sessionString = null) {
    try {
        return await fetchJSON('/api/sms-login/verify-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ phoneNumber, password, sessionString }),
        });
    } catch (error) {
        console.error('Error verifying 2FA:', error);
        throw error;
    }
}

// Validate session
export async function validateSession(accountId) {
    try {
        return await fetchJSON('/api/validate-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ accountId }),
        });
    } catch (error) {
        console.error('Error validating session:', error);
        throw error;
    }
}

// Group Discovery Functions
export async function searchGroups(accountId, query) {
    try {
        return await fetchJSON(`/api/groups/search?accountId=${accountId}&q=${encodeURIComponent(query)}`);
    } catch (error) {
        console.error('Error searching groups:', error);
        throw error;
    }
}

export async function getMyGroups(accountId) {
    try {
        return await fetchJSON(`/api/groups/my?accountId=${accountId}`);
    } catch (error) {
        console.error('Error fetching my groups:', error);
        throw error;
    }
}

export async function joinGroup(accountId, username) {
    try {
        return await fetchJSON('/api/groups/join', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ accountId, username }),
        });
    } catch (error) {
        console.error('Error joining group:', error);
        throw error;
    }
}

export async function scrapeMembers(accountId, groupId, limit = 50) {
    try {
        return await fetchJSON('/api/groups/scrape', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ accountId, groupId, limit }),
        });
    } catch (error) {
        console.error('Error scraping members:', error);
        throw error;
    }
}

// Lead Management Functions
export async function listLeads(groupId = null, status = null) {
    try {
        let path = '/api/leads/list';
        const params = new URLSearchParams();
        if (groupId) params.append('groupId', groupId);
        if (status) params.append('status', status);

        const queryString = params.toString();
        if (queryString) path += `?${queryString}`;

        return await fetchJSON(path);
    } catch (error) {
        console.error('Error listing leads:', error);
        throw error;
    }
}

// Bot Control Functions
export async function botAction(action) {
    try {
        const method = (action === 'start' || action === 'stop') ? 'POST' : 'GET';
        return await fetchJSON(`/api/bot/${action}`, { method });
    } catch (error) {
        console.error(`Error performing bot action ${action}:`, error);
        throw error;
    }
}

// Auth Functions
export async function login(body) {
    try {
        return await fetchJSON('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

export async function register(body) {
    try {
        return await fetchJSON('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}

// Account Management Functions
export async function getAccounts(userId) {
    try {
        return await fetchJSON(`/api/accounts/list?userId=${userId}`);
    } catch (error) {
        console.error('Error fetching accounts:', error);
        throw error;
    }
}

export async function saveAccount(body) {
    try {
        return await fetchJSON('/api/accounts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
    } catch (error) {
        console.error('Error saving account:', error);
        throw error;
    }
}
