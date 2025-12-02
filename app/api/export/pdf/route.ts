// This endpoint is temporarily disabled due to a legacy MongoDB dependency.
import { NextResponse } from 'next/server';
export async function GET() { return NextResponse.json({ message: "This endpoint is temporarily disabled." }, { status: 503 }); }
export async function POST() { return NextResponse.json({ message: "This endpoint is temporarily disabled." }, { status: 503 }); }