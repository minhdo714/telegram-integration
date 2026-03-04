import { NextResponse } from 'next/server';
import { WORKER_URL } from '@/lib/worker-url';

/**
 * Proxy route for images stored in the private GitHub repo.
 * The worker fetches from GitHub with auth and returns raw image bytes.
 * URL format: /api/assets/image/assets/{accountId}/{context}/{type}/{filename}
 */
export async function GET(request, { params }) {
    try {
        const pathParts = params.path; // array of path segments
        const githubPath = pathParts.join('/');

        const workerUrl = `${WORKER_URL}/api/assets/image/${githubPath}`;
        const resp = await fetch(workerUrl, { cache: 'no-store' });

        if (!resp.ok) {
            return new NextResponse('Image not found', { status: 404 });
        }

        const imageBuffer = await resp.arrayBuffer();
        const contentType = resp.headers.get('Content-Type') || 'image/jpeg';

        return new NextResponse(imageBuffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400',
            },
        });
    } catch (error) {
        console.error('GitHub image proxy error:', error);
        return new NextResponse('Proxy error', { status: 500 });
    }
}
