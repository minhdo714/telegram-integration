import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { WORKER_URL } from '@/lib/worker-url';

export async function GET(request) {
    try {
        const cookieStore = await cookies();
        const authToken = cookieStore.get('auth_token');
        const userId = cookieStore.get('user_id'); // We need to store this on login!

        // For now, let's just create a quick hack to get userId, assuming we stored it
        // If not, we might need to rely on client passing it, but cleaner to do it server side
        // Let's rely on query param passed from client for now as planned in worker

        const { searchParams } = new URL(request.url);
        const qUserId = searchParams.get('userId');

        const response = await fetch(`${WORKER_URL}/api/accounts/list?userId=${qUserId}`, {
            method: 'GET',
        });

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('Failed to parse JSON:', text);
            return NextResponse.json({ error: 'Invalid response from worker', detail: text.substring(0, 100) }, { status: 502 });
        }
        return NextResponse.json(data, { status: response.status });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
