
import { NextResponse } from 'next/server';

const WORKER_URL = (process.env.RAILWAY_WORKER_URL || 'http://localhost:5000').trim().replace(/\/$/, '');

export async function DELETE(request, { params }) {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    try {
        const response = await fetch(`${WORKER_URL}/api/ai-configs/${id}?userId=${userId}`, {
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
