import { NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { simulateSendSMSCode } from '@/lib/mockTelethon';

export async function POST(request) {
    try {
        const { phoneNumber } = await request.json();

        if (!phoneNumber || !phoneNumber.startsWith('+')) {
            return NextResponse.json(
                { error: 'Invalid phone number format' },
                { status: 400 }
            );
        }

        // In production, this would trigger Telethon worker to send SMS
        const result = await simulateSendSMSCode(phoneNumber);

        // Create session job
        const job = await db.createJob({
            type: 'sms_login',
            status: 'code_sent',
            userId: 'user1',
            phoneNumber,
            phoneHash: result.phoneHash,
            expectedCode: result.code, // Only for dev
        });

        return NextResponse.json({
            success: true,
            sessionId: job.id,
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to send code' },
            { status: 500 }
        );
    }
}
