import { NextResponse } from 'next/server';
import { WORKER_URL } from '@/lib/worker-url';

export async function DELETE(request, { params }) {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    try {
        const response = await fetch(`${WORKER_URL}/api/outreach-configs/${id}?userId=${userId}`, {
            method: 'DELETE',
            cache: 'no-store'
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
