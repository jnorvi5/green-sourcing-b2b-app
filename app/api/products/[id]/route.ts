import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { ProductSchema } from "@/types/schema";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*, suppliers!inner(user_id)")
      .eq("id", id)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if the product belongs to the user
    // The query above joins suppliers to check user_id.
    // However, Supabase returns the joined data in a nested object.
    // We need to cast or check carefully.
    // Actually, simpler way is to check if the supplier associated with the product is the current user's supplier profile.

    // Let's get the user's supplier ID first, which is safer.
    const { data: supplier, error: supplierError } = await supabase
      .from("suppliers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (supplierError || !supplier) {
      return NextResponse.json({ error: "Supplier profile not found" }, { status: 403 });
    }

    if (product.supplier_id !== supplier.id) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Remove the joined supplier data before returning if necessary, or just return the product fields.
    // The select("*") might include joined data if we asked for it, but here we did select("*, suppliers!inner(user_id)").
    // We should probably just clean it up.

    const { suppliers, ...cleanProduct } = product;
    return NextResponse.json(cleanProduct);

  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: supplier, error: supplierError } = await supabase
      .from("suppliers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (supplierError || !supplier) {
      return NextResponse.json({ error: "Supplier profile not found" }, { status: 403 });
    }

    // Verify ownership
    const { data: existingProduct, error: checkError } = await supabase
      .from("products")
      .select("supplier_id")
      .eq("id", id)
      .single();

    if (checkError || !existingProduct) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (existingProduct.supplier_id !== supplier.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();

    // Ensure supplier_id matches
    const updateData = {
      ...body,
      supplier_id: supplier.id,
      id: id, // Ensure ID matches URL
    };

    const validationResult = ProductSchema.safeParse(updateData);

    if (!validationResult.success) {
      return NextResponse.json({ error: "Validation failed", details: validationResult.error.format() }, { status: 400 });
    }

    const { data: updatedProduct, error: updateError } = await supabase
      .from("products")
      .update(validationResult.data)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json(updatedProduct);

  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: supplier, error: supplierError } = await supabase
      .from("suppliers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (supplierError || !supplier) {
      return NextResponse.json({ error: "Supplier profile not found" }, { status: 403 });
    }

    // Verify ownership
    const { data: existingProduct, error: checkError } = await supabase
      .from("products")
      .select("supplier_id")
      .eq("id", id)
      .single();

    if (checkError || !existingProduct) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (existingProduct.supplier_id !== supplier.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
