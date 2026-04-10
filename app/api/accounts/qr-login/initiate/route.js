import { NextResponse } from 'next/server';
import { initiateQRLogin } from '@/lib/railwayWorker';
import { WORKER_URL } from '@/lib/worker-url';

export async function POST(request) {
    try {
        const body = await request.json();
        const { userId } = body;
        
        const result = await initiateQRLogin(userId);

        return NextResponse.json(result);
    } catch (error) {
        console.error('QR Login Init Error:', error);
        return NextResponse.json(
            { error: 'Failed to initiate QR login' },
            { status: 500 }
        );
    }
}
