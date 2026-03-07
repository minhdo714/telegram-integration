import { NextResponse } from 'next/server';
import { WORKER_URL } from '@/lib/worker-url';

export async function POST(request) {
    try {
        const body = await request.json();
        console.log(`[API] Chat Send:`, body);

        const res = await fetch(`${WORKER_URL}/api/send-dm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const text = await res.text();
            return NextResponse.json({ error: `Worker error: ${text}` }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Chat send error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
