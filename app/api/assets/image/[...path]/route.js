import { NextResponse } from 'next/server';
import { WORKER_URL } from '@/lib/worker-url';

/**
 * Proxy route for images stored in the private GitHub repo.
 * The worker fetches from GitHub with auth and returns raw image bytes.
 * URL format: /api/assets/image/assets/{accountId}/{context}/{type}/{filename}
 */
export async function GET(request, segmentContext) {
    try {
        const { path: pathParts } = await segmentContext.params; // await params (required in Next.js 15)
        const githubPath = Array.isArray(pathParts) ? pathParts.join('/') : pathParts;

        console.log(`[github-image] Proxying: ${githubPath} via ${WORKER_URL}`);
        const workerUrl = `${WORKER_URL}/api/assets/image/${githubPath}`;
        const resp = await fetch(workerUrl, { cache: 'no-store' });

        if (!resp.ok) {
            console.error(`[github-image] Worker returned ${resp.status} for ${workerUrl}`);
            return new NextResponse(`Image not found (worker ${resp.status})`, { status: 404 });
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
        console.error('[github-image] Proxy error:', error);
        return new NextResponse(`Proxy error: ${error.message}`, { status: 500 });
    }
}
