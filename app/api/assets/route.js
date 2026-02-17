import { NextResponse } from 'next/server';

const WORKER_URL = (process.env.RAILWAY_WORKER_URL || 'http://localhost:5000').trim().replace(/\/$/, '');

export async function POST(request) {
    try {
        const body = await request.json();

        const response = await fetch(`${WORKER_URL}/api/assets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ error: data.error || 'Worker error' }, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Assets API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
