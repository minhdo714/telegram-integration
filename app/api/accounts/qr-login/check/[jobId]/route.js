import { NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { simulateQRScan } from '@/lib/mockTelethon';

export async function GET(request, { params }) {
    try {
        // In Next.js 15, params is a Promise and must be awaited
        const { jobId } = await params;
        const job = await db.getJob(jobId);

        if (!job) {
            return NextResponse.json(
                { error: 'Job not found' },
                { status: 404 }
            );
        }

        // Check if job was already scanned
        if (job.status === 'success') {
            return NextResponse.json({ status: 'success', user: job.user });
        }

        if (job.status === 'expired') {
            return NextResponse.json({ status: 'expired' });
        }

        // In development, simulate scan after some time
        if (job.status === 'qr_generated' && !job.scanSimulated) {
            await db.updateJob(jobId, { scanSimulated: true });

            // Simulate user scanning (30-60 seconds delay)
            setTimeout(async () => {
                try {
                    const result = await simulateQRScan(jobId, 120000);
                    await db.updateJob(jobId, {
                        status: 'success',
                        user: result.user,
                    });
                } catch (error) {
                    await db.updateJob(jobId, { status: 'expired' });
                }
            }, 30000 + Math.random() * 30000);
        }

        return NextResponse.json({ status: job.status });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to check scan status' },
            { status: 500 }
        );
    }
}
