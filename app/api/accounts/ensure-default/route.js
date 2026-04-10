import { NextResponse } from 'next/server';
import { getAccounts, saveAccount } from '@/lib/railwayWorker';

// Returns the first existing account, or creates a placeholder default one.
export async function POST(request) {
    try {
        const body = await request.json();
        const userId = body.userId || '1';

        // Check for existing accounts first
        const existing = await getAccounts(userId);
        if (existing?.accounts?.length > 0) {
            return NextResponse.json({ account: existing.accounts[0], created: false });
        }

        // No accounts — create a placeholder default account so uploads work
        const result = await saveAccount({
            userId,
            phoneNumber: 'default_account',
            sessionString: 'placeholder',
            telegramUsername: 'default',
            firstName: 'Default',
            lastName: 'Account',
            accountOwnership: 'user_owned',
            sessionStatus: 'active',
        });

        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        // Fetch the newly created account
        const refreshed = await getAccounts(userId);
        const account = refreshed?.accounts?.[0] || null;
        return NextResponse.json({ account, created: true });
    } catch (error) {
        console.error('ensure-default error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
