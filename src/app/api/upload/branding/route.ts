export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Verify the requesting user is authenticated
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = formData.get('type') as string | null

    if (!file || !type) {
      return NextResponse.json({ error: 'Missing file or type' }, { status: 400 })
    }

    if (!['logo', 'logo_dark', 'favicon'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    // Admin client bypasses RLS and can manage buckets
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Ensure the branding bucket exists (create as public if not)
    const { data: buckets } = await admin.storage.listBuckets()
    const bucketExists = (buckets ?? []).some(b => b.name === 'branding')
    if (!bucketExists) {
      const { error: bucketErr } = await admin.storage.createBucket('branding', {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'image/gif', 'image/x-icon'],
        fileSizeLimit: 5 * 1024 * 1024, // 5 MB
      })
      if (bucketErr) {
        return NextResponse.json({ error: `Could not create storage bucket: ${bucketErr.message}` }, { status: 500 })
      }
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
    const path = `${user.id}/${type}-${Date.now()}.${ext}`
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const { error: uploadError } = await admin.storage
      .from('branding')
      .upload(path, buffer, {
        contentType: file.type || 'image/png',
        upsert: true,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: { publicUrl } } = admin.storage.from('branding').getPublicUrl(path)

    return NextResponse.json({ url: publicUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
