import { NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { simulateVerifyCode } from '@/lib/mockTelethon';

export async function POST(request) {
    try {
        const { sessionId, code } = await request.json();

        const job = await db.getJob(sessionId);

        if (!job) {
            return NextResponse.json(
                { error: 'Session not found' },
                { status: 404 }
            );
        }

        // In production, verify with Telethon
        try {
            const result = await simulateVerifyCode(
                job.phoneNumber,
                code,
                job.phoneHash
            );

            if (result.needs2FA) {
                await db.updateJob(sessionId, { status: 'awaiting_2fa' });
                return NextResponse.json({
                    success: true,
                    needs2FA: true,
                });
            }

            // Code verified, create account
            await db.updateJob(sessionId, {
                status: 'success',
                user: result.user,
            });

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
                method: 'sms_code',
                source: 'webapp',
            });

            return NextResponse.json({
                success: true,
                needs2FA: false,
                account,
            });
        } catch (error) {
            return NextResponse.json(
                { error: 'Invalid verification code' },
                { status: 400 }
            );
        }
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to verify code' },
            { status: 500 }
        );
    }
}
