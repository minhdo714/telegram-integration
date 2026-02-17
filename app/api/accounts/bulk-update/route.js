import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        const { accountIds, userId, proxyUrl, activeConfigId } = body;

        if (!accountIds || !Array.isArray(accountIds)) {
            return NextResponse.json({ status: 'error', message: 'accountIds is required and must be an array' }, { status: 400 });
        }

        const WORKER_URL = (process.env.RAILWAY_WORKER_URL || 'http://localhost:5000').trim().replace(/\/$/, '');

        const response = await fetch(`${WORKER_URL}/api/accounts/bulk-update`, {
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

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('Failed to parse JSON:', text);
            return NextResponse.json({ error: 'Invalid response from worker', detail: text.substring(0, 100) }, { status: 502 });
        }
        return NextResponse.json(data);
    } catch (error) {
        console.error('Bulk update error:', error);
        return NextResponse.json({ status: 'error', message: 'Internal server error' }, { status: 500 });
    }
}
