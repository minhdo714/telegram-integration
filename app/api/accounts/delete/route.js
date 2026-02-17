import { NextResponse } from 'next/server';

import { WORKER_URL } from '@/lib/worker-url';

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const accountId = searchParams.get('id');
        const userId = searchParams.get('userId');

        if (!accountId) {
            return NextResponse.json({ error: 'Account ID required' }, { status: 400 });
        }

        const response = await fetch(`${WORKER_URL}/api/accounts/${accountId}?userId=${userId}`, {
            method: 'DELETE',
        });

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('Failed to parse JSON:', text);
            return NextResponse.json({ error: 'Invalid response from worker', detail: text.substring(0, 100) }, { status: 502 });
        }
        return NextResponse.json(data, { status: response.status });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
