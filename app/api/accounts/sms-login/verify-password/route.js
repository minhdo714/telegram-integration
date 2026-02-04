import { NextResponse } from 'next/server';
import { verify2FA } from '@/lib/railwayWorker';

export async function POST(request) {
    try {
        const body = await request.json();
        const { phoneNumber, password, sessionString } = body;

        if (!phoneNumber || !password) {
            return NextResponse.json(
                { error: 'Phone number and password are required' },
                { status: 400 }
            );
        }

        const result = await verify2FA(phoneNumber, password, sessionString);

        if (result.status === 'success') {
            return NextResponse.json({
                success: true,
                account: result
            });
        } else {
            throw new Error(result.error || 'Password verification failed');
        }

    } catch (error) {
        console.error('2FA Verify Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to verify password' },
            { status: 500 }
        );
    }
}
