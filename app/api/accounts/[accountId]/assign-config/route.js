export async function POST(request, { params }) {
    try {
        const { accountId } = params;
        const body = await request.json();
        const workerUrl = process.env.RAILWAY_WORKER_URL || 'http://127.0.0.1:5000';
        const response = await fetch(`${workerUrl}/api/accounts/${accountId}/assign-config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await response.json();
        return Response.json(data);
    } catch (error) {
        return Response.json({ status: 'error', error: error.message }, { status: 500 });
    }
}
