import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        RAILWAY_WORKER_URL: process.env.RAILWAY_WORKER_URL || 'NOT_SET',
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV
    });
}
