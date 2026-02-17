import { NextResponse } from 'next/server';
import { listLeads } from '@/lib/railwayWorker';
import { WORKER_URL } from '@/lib/worker-url';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const groupId = searchParams.get('groupId');
        const status = searchParams.get('status');

        const data = await listLeads(groupId, status);
        return NextResponse.json(data);

    } catch (error) {
        console.error('Fetch leads API error:', error);
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}
