import { NextResponse } from 'next/server';

const WORKER_URL = (process.env.RAILWAY_WORKER_URL || 'http://localhost:5000').trim().replace(/\/$/, '');

export async function POST(request) {
    try {
        const body = await request.json();

        // Ensure user_id is included from cookies or default
        const userId = request.cookies.get('user_id')?.value || '1';

        const response = await fetch(`${WORKER_URL}/api/accounts/bulk-import`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...body,
                user_id: userId
            }),
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
        console.error('Bulk Import API Error:', error);
        return NextResponse.json(
            { error: 'Failed to process bulk import' },
            { status: 500 }
        );
    }
}
