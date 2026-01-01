import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { ProductSchema } from "@/types/schema";

export async function GET(_request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get supplier ID for the user
    const { data: supplier, error: supplierError } = await supabase
      .from("suppliers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (supplierError || !supplier) {
      return NextResponse.json({ error: "Supplier profile not found" }, { status: 404 });
    }

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*")
      .eq("supplier_id", supplier.id)
      .order("created_at", { ascending: false });

    if (productsError) {
      return NextResponse.json({ error: productsError.message }, { status: 500 });
    }

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get supplier ID for the user
    const { data: supplier, error: supplierError } = await supabase
      .from("suppliers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (supplierError || !supplier) {
      return NextResponse.json({ error: "Supplier profile not found" }, { status: 404 });
    }

    const body = await request.json();

    // Add supplier_id to the body for validation
    const productData = {
      ...body,
      supplier_id: supplier.id,
    };

    // Validate with Zod
    // We need to parse it, but ProductSchema has optional id, created_at, updated_at which is good.
    // However, we might need to handle some type conversions if the frontend sends slightly different formats.
    // For now assuming frontend matches schema.

    // We might need to relax some validation if the schema is too strict compared to what we want to allow,
    // but let's try to stick to it.
    // Note: ProductSchema in types/schema.ts uses z.any() for certifications.

    const validationResult = ProductSchema.safeParse(productData);

    if (!validationResult.success) {
      return NextResponse.json({ error: "Validation failed", details: validationResult.error.format() }, { status: 400 });
    }

    const { data: newProduct, error: insertError } = await supabase
      .from("products")
      .insert(validationResult.data)
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
