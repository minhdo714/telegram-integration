import { NextResponse } from 'next/server';

import { WORKER_URL } from '@/lib/worker-url';

export async function POST(request) {
    try {
        const body = await request.json();
        const response = await fetch(`${WORKER_URL}/api/ai/suggest-keywords`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });

    } catch (error) {
        console.error('AI suggest keywords error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
