import { NextResponse } from 'next/server';

import { WORKER_URL } from '@/lib/worker-url';

export async function GET(request, { params }) {
    const { path: pathArray } = await params;
    const path = pathArray.join('/'); // Reconstruct path from array

    try {
        const response = await fetch(`${WORKER_URL}/uploads/${path}`);

        if (!response.ok) {
            return new NextResponse('File not found', { status: 404 });
        }

        const blob = await response.blob();
        const headers = new Headers();
        headers.set('Content-Type', response.headers.get('Content-Type'));
        headers.set('Content-Length', response.headers.get('Content-Length'));

        return new NextResponse(blob, { status: 200, headers });
    } catch (error) {
        return new NextResponse(error.message, { status: 500 });
    }
}
