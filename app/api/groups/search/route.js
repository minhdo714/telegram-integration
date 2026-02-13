import { NextResponse } from 'next/server';

const WORKER_URL = process.env.RAILWAY_WORKER_URL || 'http://localhost:5000';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const accountId = searchParams.get('accountId');
        const q = searchParams.get('q');

        if (!accountId || !q) {
            return NextResponse.json({ error: 'Account ID and search query required' }, { status: 400 });
        }

        const response = await fetch(`${WORKER_URL}/api/groups/search?accountId=${accountId}&q=${q}`);
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });

    } catch (error) {
        console.error('Search groups error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
