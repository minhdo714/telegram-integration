
import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request) {
    try {
        const data = await request.formData();
        const file = data.get('file');

        if (!file) {
            return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Save to public folder as tease_thumb.jpg
        // Note: In production Vercel, this filesystem write is ephemeral, 
        // but for local dev (which this seems to be based on file paths), it works perfectly.
        const path = join(process.cwd(), 'public', 'tease_thumb.jpg');
        await writeFile(path, buffer);
        console.log(`Saved tease thumb to ${path}`);

        return NextResponse.json({ success: true, path: '/tease_thumb.jpg' });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
    }
}
