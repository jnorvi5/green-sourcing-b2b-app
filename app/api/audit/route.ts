import { NextRequest, NextResponse } from "next/server";
import { auditEPD } from "@/lib/audit-epd";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import fs from 'fs';

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseKey) {
  // Can't proceed without DB
  console.error("Missing Supabase credentials");
}

let supabase: SupabaseClient | null = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export async function POST(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: "Server misconfiguration: DB not connected" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { pdfUrl, supplierName } = body;

    // Validate input
    if (!pdfUrl || !supplierName) {
      return NextResponse.json(
        { error: "Missing required fields: pdfUrl, supplierName" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(pdfUrl);
    } catch {
      return NextResponse.json(
        { error: "Invalid PDF URL format" },
        { status: 400 }
      );
    }

    console.log(`Starting audit for ${supplierName}: ${pdfUrl}`);

    // Run audit
    const result = await auditEPD(pdfUrl, supplierName);

    // Store in Supabase
    const { data, error } = await supabase
      .from("supplier_audits")
      .insert([result])
      .select();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    console.log(`Audit completed and stored with ID: ${data[0].id}`);

    return NextResponse.json({
      success: true,
      audit: result.audit_result,
      id: data[0].id,
      supplier: supplierName,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Audit API error:", err);
    try {
      const debugLog = `\n=== AUDIT API ERROR ${new Date().toISOString()} ===\nMessage: ${err.message}\nStack: ${err.stack}\nFull: ${JSON.stringify(err, Object.getOwnPropertyNames(err))}\n`;
      fs.appendFileSync('audit-error.log', debugLog);
    } catch (e) {
      console.error("Log write failed", e);
    }
    return NextResponse.json(
      {
        error: err.message || "Internal server error",
        details: err.stack,
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve audits
export async function GET(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: "Server misconfiguration: DB not connected" }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const supplier = searchParams.get("supplier");
    const limit = parseInt(searchParams.get("limit") || "10");

    let query = supabase
      .from("supplier_audits")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (supplier) {
      query = query.eq("supplier_name", supplier);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      audits: data,
      count: data.length,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
