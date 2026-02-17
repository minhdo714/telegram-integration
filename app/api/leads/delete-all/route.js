import { WORKER_URL } from '@/lib/worker-url';

export async function DELETE() {
    try {

        const response = await fetch(`${WORKER_URL}/api/leads/delete-all`, {
            method: 'DELETE',
        });

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('Failed to parse JSON:', text);
            return NextResponse.json({ error: 'Invalid response from worker', detail: text.substring(0, 100) }, { status: 502 });
        }

        if (!response.ok) {
            return NextResponse.json({ error: data.error }, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Delete all leads error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
