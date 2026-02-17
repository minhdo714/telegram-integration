import { NextResponse } from 'next/server';

import { WORKER_URL } from '@/lib/worker-url';

export async function GET() {
    console.log('DEBUG: Testing connectivity to worker:', WORKER_URL);

    try {
        const start = Date.now();
        const response = await fetch(`${WORKER_URL}/health`, {
            cache: 'no-store',
            next: { revalidate: 0 }
        });
        const duration = Date.now() - start;

        const text = await response.text();

        return NextResponse.json({
            status: response.status,
            ok: response.ok,
            duration: `${duration}ms`,
            target: WORKER_URL,
            responsePreview: text.substring(0, 200),
            env: process.env.NODE_ENV
        });
    } catch (error) {
        return NextResponse.json({
            status: 'error',
            message: error.message,
            target: WORKER_URL,
            stack: error.stack?.substring(0, 200)
        }, { status: 500 });
    }
}
