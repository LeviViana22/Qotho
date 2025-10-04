import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request) {
  try {
    const { to, subject, content } = await request.json()
    
    console.log('Testing Mailo SMTP configuration...')
    
    // Test different Mailo SMTP configurations
    const configs = [
      {
        name: 'Mailo Standard SMTP',
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
      },
      {
        name: 'Mailo SSL SMTP',
        config: {
          host: 'mail.mailo.com',
          port: 465,
          secure: true,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
          },
          tls: {
            rejectUnauthorized: false
          }
        }
      },
      {
        name: 'Mailo Alternative SMTP',
        config: {
          host: 'smtp.mailo.com',
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
        
        // Test sending
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: to || 'test@example.com',
          subject: subject || 'Mailo SMTP Test',
          html: content || '<p>This is a test email from Mailo SMTP</p>',
        }
        
        const result = await transporter.sendMail(mailOptions)
        
        results.push({
          name,
          success: true,
          messageId: result.messageId,
          response: result.response,
          accepted: result.accepted,
          rejected: result.rejected
        })
        
        console.log(`${name}: Email sent successfully`)
        
      } catch (error) {
        console.error(`${name}: Failed -`, error.message)
        results.push({
          name,
          success: false,
          error: error.message
        })
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: 'Mailo SMTP configuration test completed'
    })
    
  } catch (error) {
    console.error('Mailo test error:', error)
    return NextResponse.json({ 
      error: 'Failed to test Mailo configuration', 
      details: error.message
    }, { status: 500 })
  }
}
