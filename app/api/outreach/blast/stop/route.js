import { NextResponse } from 'next/server';
import { WORKER_URL } from '@/lib/worker-url';

export async function POST() {
    try {
        const response = await fetch(`${WORKER_URL}/api/outreach/blast/stop`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
