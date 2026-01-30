import { NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { simulateVerify2FA } from '@/lib/mockTelethon';

export async function POST(request) {
    try {
        const { sessionId, password } = await request.json();

        const job = await db.getJob(sessionId);

        if (!job || job.status !== 'awaiting_2fa') {
            return NextResponse.json(
                { error: 'Invalid session' },
                { status: 400 }
            );
        }

        // Verify 2FA password
        try {
            const result = await simulateVerify2FA(password);

            await db.updateJob(sessionId, {
                status: 'success',
                user: result.user,
            });

            // Create account
            const account = await db.createAccount({
                phoneNumber: job.phoneNumber,
                telegramUsername: result.user.username,
                telegramUserId: result.user.id,
                firstName: result.user.firstName,
                lastName: result.user.lastName,
                sessionFilePath: `/users/user1/sessions/${result.user.id}.session`,
                sessionCreatedAt: new Date(),
                integrationMethod: 'sms_code',
                integratedAt: new Date(),
                accountOwnership: 'user_owned',
                isExistingAccount: true,
                proxyId: 'proxy1',
                proxyTimeSlot: Math.floor(Math.random() * 3) + 1,
            });

            await db.logSessionEvent(account.id, 'created', {
                method: 'sms_code_2fa',
                source: 'webapp',
            });

            return NextResponse.json({
                success: true,
                account,
            });
        } catch (error) {
            return NextResponse.json(
                { error: 'Invalid 2FA password' },
                { status: 400 }
            );
        }
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to verify password' },
            { status: 500 }
        );
    }
}
