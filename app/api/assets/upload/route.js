import { NextResponse } from 'next/server';

const WORKER_URL = (process.env.RAILWAY_WORKER_URL || 'http://localhost:5000').trim().replace(/\/$/, '');

export async function POST(request) {
    console.log(`DEBUG: Next.js POST /api/assets/upload starting`);
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        console.log(`DEBUG: Received form data. File name: ${file?.name}, Type: ${formData.get('type')}, AccountId: ${formData.get('accountId')}`);

        console.log(`DEBUG: Proxying upload to: ${WORKER_URL}/api/assets/upload`);
        const response = await fetch(`${WORKER_URL}/api/assets/upload`, {
            method: 'POST',
            body: formData, // Forward the FormData directly
            cache: 'no-store'
        });

        const text = await response.text();
        console.log(`DEBUG: Worker /api/assets/upload status: ${response.status}, text: ${text.substring(0, 100)}`);

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('Failed to parse JSON:', text);
            return NextResponse.json({ error: 'Invalid response from worker', detail: text.substring(0, 100) }, { status: 502 });
        }
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('DEBUG: Next.js POST /api/assets/upload error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
