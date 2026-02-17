import { NextResponse } from 'next/server';

import { WORKER_URL } from '@/lib/worker-url';

export async function POST(request) {
    console.log(`DEBUG: Next.js POST /api/assets starting`);
    try {
        const body = await request.json();
        console.log(`DEBUG: Config payload for account: ${body.accountId}`);

        console.log(`DEBUG: Proxying config save to: ${WORKER_URL}/api/assets`);
        const response = await fetch(`${WORKER_URL}/api/assets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            cache: 'no-store'
        });

        const text = await response.text();
        console.log(`DEBUG: Worker /api/assets status: ${response.status}, response: ${text.substring(0, 100)}`);

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('Failed to parse JSON:', text);
            return NextResponse.json({ error: 'Invalid response from worker', detail: text.substring(0, 100) }, { status: 502 });
        }

        if (!response.ok) {
            return NextResponse.json({ error: data.error || 'Worker error' }, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('DEBUG: Next.js POST /api/assets error:', error);
        return NextResponse.json({ error: 'Internal Server Error', detail: error.message }, { status: 500 });
    }
}
