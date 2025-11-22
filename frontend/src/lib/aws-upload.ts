import { supabase } from './supabase'

export async function uploadToS3(file: File) {
  // 1. Get Presigned URL from Supabase Edge Function
  const { data, error } = await supabase.functions.invoke('upload-url', {
    body: { filename: file.name, filetype: file.type }
  })
  
  if (error) throw error

  // 2. Upload directly to S3 using the signed URL
  const upload = await fetch(data.signedUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type }
  })

  if (!upload.ok) throw new Error('Upload failed')
  
  return data.publicUrl
}
