import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const backendUrl = process.env.PYTHON_BACKEND_URL ?? 'http://127.0.0.1:5000';
        const response = await fetch(`${backendUrl.replace(/\/$/, '')}/api/solve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: req.signal,
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch {
        return NextResponse.json({ error: 'Failed to connect to Python backend' }, { status: 500 });
    }
}
