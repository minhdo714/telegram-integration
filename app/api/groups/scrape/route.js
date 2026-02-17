import { NextResponse } from 'next/server';
import { scrapeMembers } from '@/lib/railwayWorker';
import { WORKER_URL } from '@/lib/worker-url';

export async function POST(request) {
    try {
        const { accountId, groupId, limit } = await request.json();

        if (!accountId || !groupId) {
            return NextResponse.json({ error: 'Account ID and Group ID required' }, { status: 400 });
        }

        const data = await scrapeMembers(accountId, groupId, limit || 50);
        return NextResponse.json(data);

    } catch (error) {
        console.error('Scrape group API error:', error);
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}
