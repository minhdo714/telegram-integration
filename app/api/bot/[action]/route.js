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
        const data = await botAction(action);
        return NextResponse.json(data);
    } catch (error) {
        console.error(`Bot POST API error (${params.action}):`, error);
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}
