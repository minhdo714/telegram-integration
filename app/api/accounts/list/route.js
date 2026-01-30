import { NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET() {
    try {
        const accounts = await db.getAccounts('user1');

        return NextResponse.json({
            success: true,
            accounts,
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch accounts' },
            { status: 500 }
        );
    }
}
