
import { NextResponse } from 'next/server';

const WORKER_URL = process.env.RAILWAY_WORKER_URL || 'http://127.0.0.1:5000';

export async function DELETE(request, { params }) {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    try {
        const response = await fetch(`${WORKER_URL}/api/ai-configs/${id}?userId=${userId}`, {
            method: 'DELETE',
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
