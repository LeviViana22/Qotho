import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/serverEmail'

export async function GET() {
  const config = {
    EMAIL_HOST: process.env.EMAIL_HOST || 'NOT SET',
    EMAIL_PORT: process.env.EMAIL_PORT || 'NOT SET',
    EMAIL_SECURE: process.env.EMAIL_SECURE || 'NOT SET',
    EMAIL_USER: process.env.EMAIL_USER ? 'SET (hidden)' : 'NOT SET',
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? 'SET (hidden)' : 'NOT SET',
    IMAP_HOST: process.env.IMAP_HOST || 'NOT SET',
    IMAP_PORT: process.env.IMAP_PORT || 'NOT SET',
  }

  return NextResponse.json({
    success: true,
    config,
    message: 'Email configuration debug info'
  })
}

export async function POST(request) {
  try {
    const { to, subject, content } = await request.json()
    
    console.log('Debug email send test:', { to, subject, contentLength: content?.length })
    
    if (!to || !subject || !content) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        received: { to, subject, contentLength: content?.length }
      }, { status: 400 })
    }

    const result = await sendEmail(to, subject, content)
    
    return NextResponse.json({
      success: true,
      result,
      message: 'Test email sent successfully'
    })
  } catch (error) {
    console.error('Debug email send error:', error)
    return NextResponse.json({ 
      error: 'Failed to send test email', 
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
