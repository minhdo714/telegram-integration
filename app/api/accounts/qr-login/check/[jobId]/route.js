import { NextResponse } from 'next/server';

import { WORKER_URL } from '@/lib/worker-url';

export async function GET(request, { params }) {
    try {
        const { jobId } = await params;

        // Proxy request to Railway worker
        const response = await fetch(`${WORKER_URL}/api/qr-login/status/${jobId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Error checking QR status:', error);
        return NextResponse.json(
            { error: 'Failed to check scan status' },
            { status: 500 }
        );
    }
}
