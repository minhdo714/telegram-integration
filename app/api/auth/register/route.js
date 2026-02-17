import { NextResponse } from 'next/server';
import { register } from '@/lib/railwayWorker';

export async function POST(request) {
    try {
        const body = await request.json();
        const data = await register(body);

        const res = NextResponse.json(data);

        // simple session cookie for now
        if (data.token) {
            res.cookies.set('auth_token', data.token, {
                httpOnly: true,
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
        console.error('Registration API error:', error);
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}
