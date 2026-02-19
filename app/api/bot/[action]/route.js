import { NextResponse } from 'next/server';
import { botAction } from '@/lib/railwayWorker';

export async function GET(request, { params }) {
    try {
        const { action } = await params;
        const data = await botAction(action);
        return NextResponse.json(data);
    } catch (error) {
        console.error(`Bot GET API error (${params.action}):`, error);
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}

export async function POST(request, { params }) {
    try {
        const { action } = await params;

        let body = null;
        try {
            const contentType = request.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                body = await request.json();
            }
        } catch (e) {
            // Body might be empty or invalid, ignore
        }

        const data = await botAction(action, body);
        return NextResponse.json(data);
    } catch (error) {
        console.error(`Bot POST API error (${params.action}):`, error);
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}
