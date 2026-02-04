import { NextResponse } from 'next/server';

const WORKER_URL = process.env.RAILWAY_WORKER_URL || 'http://127.0.0.1:5000';

export async function DELETE(request) {
    try {
        const body = await request.json();
        const response = await fetch(`${WORKER_URL}/api/assets/delete`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
