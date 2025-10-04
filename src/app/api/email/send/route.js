import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/serverEmail'
import { addSentEmail } from '@/lib/email'

export async function POST(request) {
  try {
    console.log('=== EMAIL SEND API ROUTE CALLED ===')
    
    const body = await request.json()
    console.log('Raw request body:', body)
    
    const { to, subject, content } = body
    
    console.log('Email send request:', { to, subject, contentLength: content?.length })
    
    if (!to || !subject || !content) {
      console.log('Missing required fields')
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if email configuration is set
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error('Email configuration missing:', {
        host: !!process.env.EMAIL_HOST,
        user: !!process.env.EMAIL_USER,
        password: !!process.env.EMAIL_PASSWORD
      })
      return NextResponse.json({ 
        error: 'Email configuration not set. Please check your .env.local file.' 
      }, { status: 500 })
    }

    console.log('Attempting to send email...')
    const result = await sendEmail(to, subject, content)
    console.log('Email sent successfully:', result)

    // Add the sent email to the client-side tracking
    addSentEmail({ to, subject, content })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error sending email:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    })
    
    return NextResponse.json({ 
      error: 'Failed to send email', 
      details: error.message,
      code: error.code
    }, { status: 500 })
  }
} 