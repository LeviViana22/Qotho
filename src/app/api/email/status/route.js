import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const config = {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE,
      user: process.env.EMAIL_USER ? '***' : 'NOT SET',
      password: process.env.EMAIL_PASSWORD ? '***' : 'NOT SET',
      imapHost: process.env.IMAP_HOST || process.env.EMAIL_HOST,
      imapPort: process.env.IMAP_PORT || 993
    }
    
    const missingConfig = []
    if (!process.env.EMAIL_HOST) missingConfig.push('EMAIL_HOST')
    if (!process.env.EMAIL_USER) missingConfig.push('EMAIL_USER')
    if (!process.env.EMAIL_PASSWORD) missingConfig.push('EMAIL_PASSWORD')
    
    return NextResponse.json({
      success: missingConfig.length === 0,
      config: config,
      missing: missingConfig,
      message: missingConfig.length === 0 
        ? 'Email configuration is complete' 
        : `Missing configuration: ${missingConfig.join(', ')}`
    })
  } catch (error) {
    console.error('Error checking email status:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to check email status',
      details: error.message
    }, { status: 500 })
  }
}
