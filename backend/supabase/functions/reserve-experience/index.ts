import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: corsHeaders });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return json({ error: "Unauthorized" }, 401);
  }

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    return json({ error: "Unauthorized" }, 401);
  }

  const { experience_id } = await req.json();
  if (!experience_id) {
    return json({ error: "experience_id is required" }, 400);
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: experience, error: expError } = await userClient
    .from("experiences")
    .select("capacity, reserved_count")
    .eq("id", experience_id)
    .single();

  if (expError || !experience) {
    return json({ error: "Experience not found" }, 404);
  }

  if (experience.reserved_count >= experience.capacity) {
    return json({ error: "定員に達しています" }, 409);
  }

  const { data: existing } = await admin
    .from("reservations")
    .select("id")
    .eq("user_id", user.id)
    .eq("experience_id", experience_id)
    .single();

  if (existing) {
    return json({ error: "すでに予約済みです" }, 409);
  }

  const { data: reservation, error: resError } = await admin
    .from("reservations")
    .insert({ user_id: user.id, experience_id })
    .select()
    .single();

  if (resError) {
    return json({ error: resError.message }, 500);
  }

  await admin
    .from("experiences")
    .update({ reserved_count: experience.reserved_count + 1 })
    .eq("id", experience_id);

  return json({ reservation });
});
