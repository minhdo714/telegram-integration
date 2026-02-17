
import { NextResponse } from 'next/server';

const get_worker_url = () => {
    const url = (process.env.RAILWAY_WORKER_URL || 'http://localhost:5000').trim().replace(/\/$/, '');
    console.log('DEBUG: Resolved WORKER_URL:', url);
    return url;
};

const WORKER_URL = get_worker_url();

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    console.log(`DEBUG: Next.js GET /api/ai-configs for user ${userId}`);

    try {
        const response = await fetch(`${WORKER_URL}/api/ai-configs?userId=${userId}`, {
            cache: 'no-store'
        });
        const text = await response.text();
        console.log(`DEBUG: Worker /api/ai-configs status: ${response.status}, text: ${text.substring(0, 100)}`);
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('Failed to parse JSON:', text);
            return NextResponse.json({ error: 'Invalid response from worker', detail: text.substring(0, 100) }, { status: 502 });
        }
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('DEBUG: Next.js GET /api/ai-configs error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        console.log('DEBUG: Next.js POST /api/ai-configs proxying to worker');
        const response = await fetch(`${WORKER_URL}/api/ai-configs`, {
            method: 'POST',
            cache: 'no-store',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        const text = await response.text();
        console.log(`DEBUG: Worker POST /api/ai-configs status: ${response.status}, text: ${text.substring(0, 100)}`);
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('Failed to parse JSON:', text);
            return NextResponse.json({ error: 'Invalid response from worker', detail: text.substring(0, 100) }, { status: 502 });
        }
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('DEBUG: Next.js POST /api/ai-configs error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
