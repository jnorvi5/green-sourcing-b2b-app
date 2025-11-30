// This endpoint is temporarily disabled.
import { NextResponse } from 'next/server';

export async function POST() {
    return NextResponse.json({ message: "This endpoint is temporarily disabled." }, { status: 503 });
}