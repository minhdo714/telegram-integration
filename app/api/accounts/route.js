import { NextResponse } from 'next/server';
import { getAccounts, saveAccount } from '@/lib/railwayWorker';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ accounts: [], error: 'User ID required' }, { status: 400 });
        }

        const data = await getAccounts(userId);
        
        // Check if data has an error field from railwayWorker
        if (data.error) {
            console.warn('Get accounts returned error:', data.error);
            // Still return 200 but with empty accounts and error message for graceful degradation
            return NextResponse.json({ accounts: [], warning: data.error });
        }
        
        return NextResponse.json(data || { accounts: [] });
    } catch (error) {
        console.error('Fetch accounts API error:', error);
        // Return empty accounts instead of crashing
        return NextResponse.json({ accounts: [], error: error.message }, { status: 200 });
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
