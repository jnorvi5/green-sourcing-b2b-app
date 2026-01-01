import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createRFQConversation } from "@/lib/intercom";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
    process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rfq_id, user_role } = await req.json();

  const { data: rfq } = await supabase
    .from("rfqs")
    .select("*")
    .eq("id", rfq_id)
    .single();
  if (!rfq) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // NEW: Check if supplier is premium (if supplier is initiating)
  if (user_role === "supplier") {
    const { data: subscription } = await supabase
      .from("supplier_subscriptions")
      .select("plan_id, supplier_plans:plan_id(plan_name)")
      .eq("supplier_id", session.user.id)
      .eq("status", "active")
      .maybeSingle();

    const supplierPlans = subscription?.supplier_plans as unknown as {
      plan_name: string;
    } | null;
    const planName = supplierPlans?.plan_name;
    const isPremium = planName
      ? ["Basic", "Enterprise", "Premium"].includes(planName)
      : false;

    // Check if existing conversation (architect initiated)
    const { data: existing } = await supabase
      .from("rfq_chat_sessions")
      .select("intercom_conversation_id")
      .eq("rfq_id", rfq_id)
      .maybeSingle();

    // If not premium AND no existing conversation, deny
    if (!isPremium && !existing) {
      return NextResponse.json(
        {
          error: "Premium feature",
          message:
            "Upgrade to Basic or Enterprise plan to initiate conversations with architects.",
          requires_premium: true,
        },
        { status: 403 }
      );
    }
  }

  // Check existing conversation
  const { data: existingSession } = await supabase
    .from("rfq_chat_sessions")
    .select("intercom_conversation_id")
    .eq("rfq_id", rfq_id)
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (existingSession) {
    return NextResponse.json({
      conversation_id: existingSession.intercom_conversation_id,
    });
  }

  // Create new Intercom conversation
  const conversation = await createRFQConversation(
    rfq_id,
    rfq.architect_id,
    rfq.supplier_id || rfq.matched_suppliers?.[0],
    rfq
  );

  // Save session
  await supabase.from("rfq_chat_sessions").insert({
    rfq_id,
    user_id: session.user.id,
    user_role,
    intercom_conversation_id: conversation.id,
  });

  return NextResponse.json({ conversation_id: conversation.id });
}
