import { NextResponse } from 'next/server';
import { initiateSMSLogin } from '@/lib/railwayWorker';

export async function POST(request) {
    try {
        const body = await request.json();
        const { phoneNumber, sessionString } = body;

        if (!phoneNumber) {
            return NextResponse.json(
                { error: 'Phone number is required' },
                { status: 400 }
            );
        }

        const result = await initiateSMSLogin(phoneNumber, sessionString);
        return NextResponse.json(result);

    } catch (error) {
        console.error('SMS Request Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send SMS code' },
            { status: 500 }
        );
    }
}
