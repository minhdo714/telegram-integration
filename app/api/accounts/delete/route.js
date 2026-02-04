import { NextResponse } from 'next/server';

const WORKER_URL = process.env.RAILWAY_WORKER_URL || 'http://localhost:5000';

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const accountId = searchParams.get('id');
        const userId = searchParams.get('userId');

        if (!accountId) {
            return NextResponse.json({ error: 'Account ID required' }, { status: 400 });
        }

        const response = await fetch(`${WORKER_URL}/api/accounts/${accountId}?userId=${userId}`, {
            method: 'DELETE',
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
