import { NextResponse } from 'next/server';

const WORKER_URL = (process.env.RAILWAY_WORKER_URL || 'http://localhost:5000').trim().replace(/\/$/, '');

export async function POST(request) {
    try {
        const body = await request.json();
        const { accountId, recipient, message } = body;

        // Validation
        if (!accountId) {
            return NextResponse.json({ error: 'Account ID required' }, { status: 400 });
        }
        if (!recipient) {
            return NextResponse.json({ error: 'Recipient required' }, { status: 400 });
        }
        if (!message) {
            return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
        }
        if (message.length > 4096) {
            return NextResponse.json({ error: 'Message too long (max 4096 characters)' }, { status: 400 });
        }

        // Forward to backend worker
        const response = await fetch(`${WORKER_URL}/api/send-dm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accountId, recipient, message }),
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });

    } catch (error) {
        console.error('Send DM error:', error);
        return NextResponse.json(
            { status: 'error', error_type: 'unknown', message: error.message },
            { status: 500 }
        );
    }
}
