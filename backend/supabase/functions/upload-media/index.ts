import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const CLOUDFLARE_ACCOUNT_ID = Deno.env.get("CLOUDFLARE_ACCOUNT_ID")!;
const CLOUDFLARE_R2_TOKEN = Deno.env.get("CLOUDFLARE_R2_TOKEN")!;
const CLOUDFLARE_STREAM_TOKEN = Deno.env.get("CLOUDFLARE_STREAM_TOKEN")!;
const CLOUDFLARE_R2_PUBLIC_URL = Deno.env.get("CLOUDFLARE_R2_PUBLIC_URL")!;

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

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Unauthorized" }, 401);

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return json({ error: "Unauthorized" }, 401);

  const contentType = req.headers.get("content-type") ?? "";


  // 画像・動画: multipart/form-data で受け取る
  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return json({ error: "file is required" }, 400);

    const isVideo = file.type.startsWith("video/");

    if (isVideo) {
      // 動画: Cloudflare Stream API に直接アップロード
      const streamForm = new FormData();
      streamForm.append("file", file, file.name);

      const uploadRes = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${CLOUDFLARE_STREAM_TOKEN}` },
          body: streamForm,
        }
      );
      const data = await uploadRes.json();
      if (!uploadRes.ok) return json({ error: "Stream アップロードに失敗しました", detail: data }, 500);

      const uid = data.result.uid;
      return json({ mediaUrl: `https://iframe.cloudflarestream.com/${uid}` });
    }

    // 画像: R2 にアップロード
    const ext = file.name.split(".").pop() ?? "jpg";
    const key = `${user.id}/${Date.now()}.${ext}`;

    const uploadRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/r2/buckets/curio-meet-media/objects/${key}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_R2_TOKEN}`,
          "Content-Type": file.type,
        },
        body: await file.arrayBuffer(),
      }
    );

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      return json({ error: "R2 アップロードに失敗しました", detail: err }, 500);
    }

    return json({ mediaUrl: `${CLOUDFLARE_R2_PUBLIC_URL}/${key}` });
  }

  return json({ error: "Unsupported content type" }, 400);
});
