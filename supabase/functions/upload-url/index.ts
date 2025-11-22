import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { S3Client, PutObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.450.0"
import { getSignedUrl } from "https://esm.sh/@aws-sdk/s3-request-presigner@3.450.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0"

serve(async (req) => {
  // 1. Auth Check
  const authHeader = req.headers.get('Authorization')!
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  )
  const { data: { user }, error } = await supabaseClient.auth.getUser()
  if (error || !user) return new Response('Unauthorized', { status: 401 })

  // 2. Parse Body
  const { filename, filetype } = await req.json()
  const key = `public/${user.id}/${Date.now()}-${filename}`

  // 3. Generate Presigned URL
  const s3 = new S3Client({
    region: Deno.env.get('AWS_REGION'),
    credentials: {
      accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID')!,
      secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY')!,
    },
  })

  const command = new PutObjectCommand({
    Bucket: Deno.env.get('AWS_BUCKET_NAME'),
    Key: key,
    ContentType: filetype,
  })

  const signedUrl = await getSignedUrl(s3, command, { expiresIn: 60 })

  return new Response(
    JSON.stringify({ signedUrl, key, publicUrl: `https://${Deno.env.get('CDN_URL')}/${key}` }),
    { headers: { "Content-Type": "application/json" } }
  )
})
