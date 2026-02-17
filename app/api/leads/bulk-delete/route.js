import { NextResponse } from 'next/server';

import { WORKER_URL } from '@/lib/worker-url';

export async function POST(request) {
    try {
        const body = await request.json();

        const response = await fetch(`${WORKER_URL}/api/leads/bulk-delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
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
        console.error('Bulk delete leads error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
