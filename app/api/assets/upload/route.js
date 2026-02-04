import { NextResponse } from 'next/server';

const WORKER_URL = process.env.RAILWAY_WORKER_URL || 'http://localhost:5000';

export async function POST(request) {
    try {
        const formData = await request.formData();

        const response = await fetch(`${WORKER_URL}/api/assets/upload`, {
            method: 'POST',
            body: formData, // Forward the FormData directly
            // Note: Don't set Content-Type header manually for FormData, fetch handles it
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
