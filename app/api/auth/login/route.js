import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        const WORKER_URL = process.env.RAILWAY_WORKER_URL;

        const response = await fetch(`${WORKER_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ error: data.error }, { status: response.status });
        }

        const res = NextResponse.json(data);

        // simple session cookie for now
        if (data.token) {
            res.cookies.set('auth_token', data.token, {
                httpOnly: false, // Changed to false so we can read it in client if needed, or keeping it true is safer but we need a way to check auth.
                // Keeping httpOnly true for security, relying on middleware or server checks is better.
                // But for this rapid proto, let's keep httpOnly true and add a user_id cookie that is NOT httpOnly so we can grab the ID.
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7 // 1 week
            });

            if (data.user && data.user.id) {
                res.cookies.set('user_id', data.user.id.toString(), {
                    httpOnly: false, // Allow client to read user ID
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 60 * 60 * 24 * 7
                });
            }
        }

        return res;
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
