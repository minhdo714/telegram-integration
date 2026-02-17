import { NextResponse } from 'next/server';
import { getMyGroups } from '@/lib/railwayWorker';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const accountId = searchParams.get('accountId');

        if (!accountId) {
            return NextResponse.json({ error: 'Account ID required' }, { status: 400 });
        }

        const data = await getMyGroups(accountId);
        return NextResponse.json(data);

    } catch (error) {
        console.error('My groups API error:', error);
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}
