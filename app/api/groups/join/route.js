import { NextResponse } from 'next/server';
import { joinGroup } from '@/lib/railwayWorker';
import { WORKER_URL } from '@/lib/worker-url';

export async function POST(request) {
    try {
        const { accountId, username } = await request.json();

        if (!accountId || !username) {
            return NextResponse.json({ error: 'Account ID and Group Username required' }, { status: 400 });
        }

        const data = await joinGroup(accountId, username);
        return NextResponse.json(data);

    } catch (error) {
        console.error('Join group API error:', error);
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}
