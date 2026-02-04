import { NextResponse } from 'next/server';
import { initiateQRLogin } from '@/lib/railwayWorker';

export async function POST() {
    try {
        const result = await initiateQRLogin();

        return NextResponse.json(result);
    } catch (error) {
        console.error('QR Login Init Error:', error);
        return NextResponse.json(
            { error: 'Failed to initiate QR login' },
            { status: 500 }
        );
    }
}
