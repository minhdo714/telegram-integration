import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        const { accountIds, userId, proxyUrl, activeConfigId } = body;

        if (!accountIds || !Array.isArray(accountIds)) {
            return NextResponse.json({ status: 'error', message: 'accountIds is required and must be an array' }, { status: 400 });
        }

        const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';

        const response = await fetch(`${backendUrl}/api/accounts/bulk-update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                account_ids: accountIds,
                user_id: userId,
                proxy_url: proxyUrl,
                active_config_id: activeConfigId
            }),
        });

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Bulk update error:', error);
        return NextResponse.json({ status: 'error', message: 'Internal server error' }, { status: 500 });
    }
}
