import { NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET(request, { params }) {
    try {
        const { jobId } = params;
        const job = await db.getJob(jobId);

        if (!job) {
            return NextResponse.json(
                { error: 'Job not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            status: job.status,
            qrUrl: job.qrUrl,
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to get job status' },
            { status: 500 }
        );
    }
}
