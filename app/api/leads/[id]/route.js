import { NextResponse } from 'next/server';

import { WORKER_URL } from '@/lib/worker-url';

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        const response = await fetch(`${WORKER_URL}/api/leads/${id}`, {
            method: 'DELETE'
        });
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
