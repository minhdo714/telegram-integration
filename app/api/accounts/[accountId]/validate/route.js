import { NextResponse } from 'next/server';

const WORKER_URL = process.env.RAILWAY_WORKER_URL || 'http://localhost:5000';

export async function POST(request, { params }) {
    try {
        // In Next.js 15, params is a Promise and must be awaited
        const { accountId } = await params;

        // Call the backend worker to validate the session
        const response = await fetch(`${WORKER_URL}/api/validate-session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accountId: accountId }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json(
                { error: errorData.error || 'Validation failed' },
                { status: response.status }
            );
        }

        const data = await response.json();

        return NextResponse.json({
            success: true,
            status: data.status,
            message: data.message
        });
    } catch (error) {
        console.error('Validation error:', error);
        return NextResponse.json(
            { error: 'Failed to validate session' },
            { status: 500 }
        );
    }
}
