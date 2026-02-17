import { NextResponse } from 'next/server';

const WORKER_URL = (process.env.RAILWAY_WORKER_URL || 'http://localhost:5000').trim().replace(/\/$/, '');

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
