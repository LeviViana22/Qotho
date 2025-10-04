import { NextResponse } from 'next/server'
import { softDeleteEmail } from '@/lib/serverEmail'

export async function POST(request) {
  try {
    const body = await request.json()
    const emails = Array.isArray(body?.emails) ? body.emails : []
    let count = 0
    for (const item of emails) {
      if (item && item.id) {
        const ok = softDeleteEmail(item)
        if (ok) count += 1
      }
    }
    return NextResponse.json({ success: true, deleted: count })
  } catch (e) {
    return NextResponse.json({ success: false, error: e?.message || 'Unknown error' }, { status: 500 })
  }
}


