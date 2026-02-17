import { NextResponse } from 'next/server';
import { searchGroups } from '@/lib/railwayWorker';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const accountId = searchParams.get('accountId');
        const query = searchParams.get('q');

        if (!accountId || !query) {
            return NextResponse.json({ error: 'Account ID and Query required' }, { status: 400 });
        }

        const data = await searchGroups(accountId, query);
        return NextResponse.json(data);

    } catch (error) {
        console.error('Search groups API error:', error);
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}
