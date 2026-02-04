import { NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function POST(request, { params }) {
    try {
        // In Next.js 15, params is a Promise and must be awaited
        const { jobId } = await params;
        const job = await db.getJob(jobId);

        if (!job || job.status !== 'success') {
            return NextResponse.json(
                { error: 'Job not ready' },
                { status: 400 }
            );
        }

        // Create account record
        const account = await db.createAccount({
            phoneNumber: job.user.phone,
            telegramUsername: job.user.username,
            telegramUserId: job.user.id,
            firstName: job.user.firstName,
            lastName: job.user.lastName,
            sessionFilePath: `/users/user1/sessions/${job.user.id}.session`,
            sessionCreatedAt: new Date(),
            integrationMethod: 'qr_code',
            integratedAt: new Date(),
            accountOwnership: 'user_owned',
            isExistingAccount: true,
            proxyId: 'proxy1', // In production, assign from pool
            proxyTimeSlot: Math.floor(Math.random() * 3) + 1,
        });

        // Log session event
        await db.logSessionEvent(account.id, 'created', {
            method: 'qr_code',
            source: 'webapp',
        });

        return NextResponse.json({
            success: true,
            account,
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to complete QR login' },
            { status: 500 }
        );
    }
}
