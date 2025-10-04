import { NextResponse } from 'next/server'
import { toggleFavoritar } from '@/lib/serverEmail'

export async function POST(request) {
  try {
    const { emailId, favoritar } = await request.json()
    
    if (!emailId) {
      return NextResponse.json({ error: 'Email ID is required' }, { status: 400 })
    }

    const success = toggleFavoritar(emailId, favoritar)

    return NextResponse.json({ success })
  } catch (error) {
    console.error('Error toggling favoritar:', error)
    return NextResponse.json({ error: 'Failed to toggle favoritar' }, { status: 500 })
  }
}
