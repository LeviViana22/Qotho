import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function GET() {
  try {
    console.log('Checking Mailo account status...')
    
    // Test different Mailo configurations to see what works
    const configs = [
      {
        name: 'Current SSL Config',
        config: {
          host: 'mail.mailo.com',
          port: 465,
          secure: true,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
          },
          tls: {
            rejectUnauthorized: false,
            secureProtocol: 'TLSv1_2_method'
          }
        }
      },
      {
        name: 'STARTTLS Config',
        config: {
          host: 'mail.mailo.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
          },
          tls: {
            rejectUnauthorized: false
          }
        }
      }
    ]

    const results = []

    for (const { name, config } of configs) {
      try {
        console.log(`Testing ${name}...`)
        
        const transporter = nodemailer.createTransport(config)
        
        // Test connection
        await transporter.verify()
        console.log(`${name}: Connection verified`)
        
        // Test sending to yourself (this should work if account is properly configured)
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: process.env.EMAIL_USER, // Send to yourself
          subject: `Mailo Status Test - ${name}`,
          html: `<p>This is a test email to check Mailo account status.</p><p>Config: ${name}</p><p>Time: ${new Date().toISOString()}</p>`,
        }
        
        const result = await transporter.sendMail(mailOptions)
        
        results.push({
          name,
          success: true,
          messageId: result.messageId,
          response: result.response,
          accepted: result.accepted,
          rejected: result.rejected,
          note: 'Email sent successfully - check your Mailo inbox'
        })
        
        console.log(`${name}: Email sent successfully`)
        
      } catch (error) {
        console.error(`${name}: Failed -`, error.message)
        results.push({
          name,
          success: false,
          error: error.message,
          note: 'Connection or authentication failed'
        })
      }
    }

    return NextResponse.json({
      success: true,
      account: process.env.EMAIL_USER,
      results,
      message: 'Mailo account status check completed',
      recommendations: [
        'Check your Mailo account settings for SMTP restrictions',
        'Verify your app password has full SMTP permissions',
        'Check if there are any sending limits on your account',
        'Look for the test emails in your Mailo inbox'
      ]
    })
    
  } catch (error) {
    console.error('Mailo status check error:', error)
    return NextResponse.json({ 
      error: 'Failed to check Mailo status', 
      details: error.message
    }, { status: 500 })
  }
}
