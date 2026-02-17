import { NextResponse } from 'next/server';

import { WORKER_URL } from '@/lib/worker-url';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
        return NextResponse.json({ error: 'Account ID required' }, { status: 400 });
    }

    try {
        const response = await fetch(`${WORKER_URL}/api/assets/config?accountId=${accountId}`);
        const text = await response.text();
        try {
            const data = JSON.parse(text);
            return NextResponse.json(data, { status: response.status });
        } catch (e) {
            console.error('Failed to parse JSON:', text);
            return NextResponse.json({ error: 'Invalid response from worker', detail: text.substring(0, 100) }, { status: 502 });
        }
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
