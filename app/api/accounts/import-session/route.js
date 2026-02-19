import { NextResponse } from 'next/server';
import { WORKER_URL } from '@/lib/worker-url';

// POST /api/accounts/import-session
// Body: { accountId, sessionData: { session_string, api_id?, api_hash? }, userId }
export async function POST(request) {
    try {
        const body = await request.json();
        const { accountId, sessionData, userId } = body;

        if (!accountId || !sessionData) {
            return NextResponse.json({ error: 'accountId and sessionData are required' }, { status: 400 });
        }

        const response = await fetch(`${WORKER_URL}/api/accounts/import-session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                account_id: accountId,
                user_id: userId || 1,
                session_data: sessionData,
            }),
        });

        const text = await response.text();
        let data;
        try { data = JSON.parse(text); } catch {
            return NextResponse.json({ error: 'Invalid worker response', detail: text.substring(0, 200) }, { status: 502 });
        }

        if (!response.ok) {
            return NextResponse.json({ error: data.error || 'Session import failed' }, { status: response.status });
        }

        return NextResponse.json({ status: 'success', ...data });
    } catch (error) {
        console.error('Import session error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
