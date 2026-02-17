import { NextResponse } from 'next/server';

const WORKER_URL = (process.env.RAILWAY_WORKER_URL || 'http://localhost:5000').trim().replace(/\/$/, '');

export async function POST(request, { params }) {
    try {
        const { id } = await params;

        // Call the worker's validate-session endpoint
        // Note: The worker expects { accountId: id } in the body
        const response = await fetch(`${WORKER_URL}/api/validate-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ accountId: id }),
        });

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('Failed to parse JSON:', text);
            return NextResponse.json({ error: 'Invalid response from worker', detail: text.substring(0, 100) }, { status: 502 });
        }

        if (!response.ok) {
            return NextResponse.json({ error: data.error }, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Session validation error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
