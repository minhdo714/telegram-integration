
import { NextResponse } from 'next/server';

import { WORKER_URL } from '@/lib/worker-url';

export async function POST(request) {
    try {
        const body = await request.json();
        console.log('DEBUG: Next.js POST /api/ai-configs/save proxying to worker');
        const response = await fetch(`${WORKER_URL}/api/ai-configs/save`, {
            method: 'POST',
            cache: 'no-store',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        const text = await response.text();
        console.log('DEBUG: Worker raw response:', text.substring(0, 100));
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
