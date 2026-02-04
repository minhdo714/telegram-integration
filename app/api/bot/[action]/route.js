import { NextResponse } from 'next/server';

const WORKER_URL = process.env.RAILWAY_WORKER_URL || 'http://localhost:5000';

export async function GET(request, { params }) {
    try {
        const { action } = await params; // 'status'
        const response = await fetch(`${WORKER_URL}/api/bot/${action}`);
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    try {
        const { action } = await params; // 'start', 'stop'
        const response = await fetch(`${WORKER_URL}/api/bot/${action}`, {
            method: 'POST'
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
