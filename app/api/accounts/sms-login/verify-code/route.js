import { NextResponse } from 'next/server';
import { verifySMSCode } from '@/lib/railwayWorker';

export async function POST(request) {
    try {
        const body = await request.json();
        const { phoneNumber, code, phoneHash, sessionString } = body;

        console.log('API: Verifying code with sessionString present:', !!sessionString);

        if (!phoneNumber || !code || !phoneHash) {
            return NextResponse.json(
                { error: 'Phone number, code, and phone hash are required' },
                { status: 400 }
            );
        }

        const result = await verifySMSCode(phoneNumber, code, phoneHash, sessionString);

        // Normalize response for frontend
        if (result.status === 'success') {
            return NextResponse.json({
                success: true,
                needs2FA: false,
                account: result.account  // Extract just the account object
            });
        } else if (result.status === 'password_required') {
            return NextResponse.json({
                success: true,
                needs2FA: true
            });
        } else {
            throw new Error(result.error || 'Verification failed');
        }

    } catch (error) {
        console.error('SMS Verify Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to verify code' },
            { status: 500 }
        );
    }
}
