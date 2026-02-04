import { NextResponse } from 'next/server';
import { checkQRLoginStatus } from '@/lib/railwayWorker';

export async function GET(request, { params }) {
    try {
        // In Next.js 15, params is a Promise and must be awaited
        const { jobId } = await params;
        const result = await checkQRLoginStatus(jobId);

        return NextResponse.json(result);
    } catch (error) {
        console.error('QR Status Check Error:', error);
        return NextResponse.json(
            { error: 'Failed to get job status' },
            { status: 500 }
        );
    }
}
