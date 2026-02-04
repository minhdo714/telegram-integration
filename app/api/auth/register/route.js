import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        const WORKER_URL = process.env.RAILWAY_WORKER_URL;

        const response = await fetch(`${WORKER_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ error: data.error }, { status: response.status });
        }

        const res = NextResponse.json(data);

        if (data.token) {
            res.cookies.set('auth_token', data.token, {
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7
            });

            if (data.user && data.user.id) {
                res.cookies.set('user_id', data.user.id.toString(), {
                    httpOnly: false,
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
