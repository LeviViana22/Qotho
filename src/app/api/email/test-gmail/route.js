import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request) {
  try {
    const { to, subject, content } = await request.json()
    
    console.log('Testing Gmail SMTP as alternative...')
    
    // Gmail SMTP configuration (you'll need to set up Gmail app password)
    const gmailConfig = {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER || 'your-gmail@gmail.com',
        pass: process.env.GMAIL_PASSWORD || 'your-app-password',
      },
      tls: {
        rejectUnauthorized: false
      }
    }

    try {
      console.log('Testing Gmail SMTP...')
      
      const transporter = nodemailer.createTransport(gmailConfig)
      
      // Test connection
      await transporter.verify()
      console.log('Gmail: Connection verified')
      
      // Test sending
      const mailOptions = {
        from: process.env.GMAIL_USER || 'your-gmail@gmail.com',
        to: to || 'test@example.com',
        subject: subject || 'Gmail SMTP Test',
        html: content || '<p>This is a test email from Gmail SMTP</p>',
      }
      
      const result = await transporter.sendMail(mailOptions)
      
      console.log('Gmail: Email sent successfully')
      
      return NextResponse.json({
        success: true,
        provider: 'Gmail',
        messageId: result.messageId,
        response: result.response,
        accepted: result.accepted,
        rejected: result.rejected,
        message: 'Gmail SMTP test completed successfully'
      })
      
    } catch (error) {
      console.error('Gmail test failed:', error.message)
      return NextResponse.json({
        success: false,
        provider: 'Gmail',
        error: error.message,
        message: 'Gmail SMTP test failed - this is expected if Gmail credentials are not configured'
      })
    }
    
  } catch (error) {
    console.error('Gmail test error:', error)
    return NextResponse.json({ 
      error: 'Failed to test Gmail configuration', 
      details: error.message
    }, { status: 500 })
  }
}
