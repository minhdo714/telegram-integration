import { NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function DELETE(request, { params }) {
    try {
        // In Next.js 15, params is a Promise and must be awaited
        const { accountId } = await params;
        const account = await db.getAccount(accountId);

        if (!account) {
            return NextResponse.json(
                { error: 'Account not found' },
                { status: 404 }
            );
        }

        // In production, this would also delete session file from R2
        await db.deleteAccount(accountId);

        await db.logSessionEvent(accountId, 'deleted', {
            deletedBy: 'user',
        });

        return NextResponse.json({
            success: true,
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to delete account' },
            { status: 500 }
        );
    }
}
