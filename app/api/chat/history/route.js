import { NextResponse } from 'next/server';
import { WORKER_URL } from '@/lib/worker-url';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const accountId = searchParams.get('accountId');
        const sessionId = searchParams.get('sessionId');

        console.log(`[API] Chat History: accountId=${accountId}, sessionId=${sessionId}`);

        if (sessionId) {
            const res = await fetch(`${WORKER_URL}/api/chat/history?sessionId=${sessionId}`, { cache: 'no-store' });
            if (!res.ok) {
                const text = await res.text();
                return NextResponse.json({ error: `Worker error: ${text}` }, { status: res.status });
            }
            const data = await res.json();
            return NextResponse.json(data);
        }

        if (accountId) {
            const res = await fetch(`${WORKER_URL}/api/chat/sessions?accountId=${accountId}`, { cache: 'no-store' });
            if (!res.ok) {
                const text = await res.text();
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
