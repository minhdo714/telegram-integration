import { NextResponse } from 'next/server';
import { WORKER_URL } from '@/lib/worker-url';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const accountId = searchParams.get('accountId');
        const sessionId = searchParams.get('sessionId');

        console.log(`[API] History request: accountId=${accountId}, sessionId=${sessionId}`);
        console.log(`[API] Fetching from worker: ${WORKER_URL}`);

        if (sessionId) {
            const res = await fetch(`${WORKER_URL}/api/chat/history?sessionId=${sessionId}`, { cache: 'no-store' });
            if (!res.ok) {
                const text = await res.text();
                console.error(`[API] Worker error (${res.status}):`, text);
                return NextResponse.json({ error: `Worker error: ${text}` }, { status: res.status });
            }
            const data = await res.json();
            return NextResponse.json(data);
        }

        if (accountId) {
            const res = await fetch(`${WORKER_URL}/api/chat/sessions?accountId=${accountId}`, { cache: 'no-store' });
            if (!res.ok) {
                const text = await res.text();
                console.error(`[API] Worker error (${res.status}):`, text);
                return NextResponse.json({ error: `Worker error: ${text}` }, { status: res.status });
            }
            const data = await res.json();
            return NextResponse.json(data);
        }

        return NextResponse.json({ error: 'Missing accountId or sessionId' }, { status: 400 });
    } catch (error) {
        console.error('Chat history error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
