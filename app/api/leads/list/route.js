import { NextResponse } from 'next/server';

const WORKER_URL = process.env.RAILWAY_WORKER_URL || 'http://localhost:5000';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const groupId = searchParams.get('groupId');

        let url = `${WORKER_URL}/api/leads/list`;
        if (groupId) url += `?groupId=${groupId}`;

        const response = await fetch(url);
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });

    } catch (error) {
        console.error('Fetch leads error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
