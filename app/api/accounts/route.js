import { NextResponse } from 'next/server';
import { getAccounts, saveAccount } from '@/lib/railwayWorker';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        const data = await getAccounts(userId);
        return NextResponse.json(data);
    } catch (error) {
        console.error('Fetch accounts API error:', error);
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const data = await saveAccount(body);
        return NextResponse.json(data);
    } catch (error) {
        console.error('Save account API error:', error);
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}
