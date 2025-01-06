import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        // Parse the JSON body form the request
        const body = await req.json();

        // Send body to Flask API
        const response = await fetch('http://localhost:5000/api/solve', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        // Receive response
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to connect to Python backend' }, { status: 500 });
    }
}