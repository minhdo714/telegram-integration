import { NextResponse } from 'next/server';
import { WORKER_URL } from '@/lib/worker-url';

// PATCH /api/accounts/[id]
// Updates a single account's proxyUrl and/or activeConfigId
export async function PATCH(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { proxyUrl, activeConfigId } = body;

        const errors = [];

        // Update proxy if provided
        if (proxyUrl !== undefined) {
            const res = await fetch(`${WORKER_URL}/api/accounts/${id}/proxy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ proxyUrl }),
            });
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                errors.push(`Proxy: ${d.error || res.statusText}`);
            }
        }

        // Update AI config if provided
        if (activeConfigId !== undefined) {
            const res = await fetch(`${WORKER_URL}/api/accounts/${id}/assign-config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activeConfigId }),
            });
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                errors.push(`AI Config: ${d.error || res.statusText}`);
            }
        }

        if (errors.length > 0) {
            return NextResponse.json({ error: errors.join('; ') }, { status: 400 });
        }

        return NextResponse.json({ status: 'success' });
    } catch (error) {
        console.error('PATCH account error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
