// GitHub API client for session file storage

const GITHUB_API = 'https://api.github.com';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_SESSIONS_REPO; // e.g., 'minhdo714/telegram-sessions'

// Upload session file to GitHub
export async function uploadSession(accountId, sessionContent) {
    try {
        const path = `sessions/${accountId}.session`;
        const content = Buffer.from(sessionContent).toString('base64');

        const response = await fetch(
            `${GITHUB_API}/repos/${GITHUB_REPO}/contents/${path}`,
            {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: `Add session for account ${accountId}`,
                    content,
                    branch: 'main',
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`GitHub upload failed: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            success: true,
            path: data.content.path,
            sha: data.content.sha,
        };
    } catch (error) {
        console.error('Error uploading session to GitHub:', error);
        throw error;
    }
}

// Download session file from GitHub
export async function downloadSession(accountId) {
    try {
        const path = `sessions/${accountId}.session`;

        const response = await fetch(
            `${GITHUB_API}/repos/${GITHUB_REPO}/contents/${path}`,
            {
                headers: {
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github.v3.raw',
                },
            }
        );

        if (!response.ok) {
            if (response.status === 404) {
                return null; // Session doesn't exist
            }
            throw new Error(`GitHub download failed: ${response.statusText}`);
        }

        const content = await response.arrayBuffer();
        return {
            success: true,
            content: Buffer.from(content),
        };
    } catch (error) {
        console.error('Error downloading session from GitHub:', error);
        return null;
    }
}

// Delete session file from GitHub
export async function deleteSession(accountId) {
    try {
        const path = `sessions/${accountId}.session`;

        // First, get the file SHA (required for deletion)
        const getResponse = await fetch(
            `${GITHUB_API}/repos/${GITHUB_REPO}/contents/${path}`,
            {
                headers: {
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                },
            }
        );

        if (!getResponse.ok) {
            throw new Error('Session not found');
        }

        const fileData = await getResponse.json();

        // Now delete the file
        const deleteResponse = await fetch(
            `${GITHUB_API}/repos/${GITHUB_REPO}/contents/${path}`,
            {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: `Delete session for account ${accountId}`,
                    sha: fileData.sha,
                    branch: 'main',
                }),
            }
        );

        if (!deleteResponse.ok) {
            throw new Error(`GitHub deletion failed: ${deleteResponse.statusText}`);
        }

        return { success: true };
    } catch (error) {
        console.error('Error deleting session from GitHub:', error);
        throw error;
    }
}

// Check if session exists
export async function sessionExists(accountId) {
    try {
        const path = `sessions/${accountId}.session`;

        const response = await fetch(
            `${GITHUB_API}/repos/${GITHUB_REPO}/contents/${path}`,
            {
                headers: {
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                },
            }
        );

        return response.ok;
    } catch (error) {
        return false;
    }
}
