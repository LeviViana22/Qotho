import { NextResponse } from 'next/server'
import { toggleStar } from '@/lib/email'

export async function POST(request) {
  try {
    const { emailId } = await request.json()
    
    if (!emailId) {
      return NextResponse.json({ error: 'Email ID is required' }, { status: 400 })
    }

    const success = toggleStar(emailId)

    return NextResponse.json({ success })
  } catch (error) {
    console.error('Error toggling star:', error)
    return NextResponse.json({ error: 'Failed to toggle star' }, { status: 500 })
  }
} 