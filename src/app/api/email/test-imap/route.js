import { NextResponse } from 'next/server'
import Imap from 'imap'

export async function GET() {
  try {
    console.log('Testing IMAP connection...')
    
    const config = {
      user: process.env.EMAIL_USER,
      password: process.env.EMAIL_PASSWORD,
      host: process.env.IMAP_HOST || process.env.EMAIL_HOST,
      port: parseInt(process.env.IMAP_PORT) || 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    }
    
    console.log('IMAP Config:', {
      user: process.env.EMAIL_USER,
      host: process.env.IMAP_HOST || process.env.EMAIL_HOST,
      port: parseInt(process.env.IMAP_PORT) || 993,
      tls: true
    })
    
    return new Promise((resolve) => {
      const imap = new Imap(config)
      let connected = false
      let error = null
      
      const timeout = setTimeout(() => {
        if (!connected) {
          console.log('IMAP connection timeout')
          imap.end()
          resolve(NextResponse.json({
            success: false,
            error: 'Connection timeout',
            config: {
              user: process.env.EMAIL_USER,
              host: process.env.EMAIL_HOST,
              port: parseInt(process.env.EMAIL_PORT) || 993,
              tls: process.env.EMAIL_TLS === 'true'
            }
          }))
        }
      }, 10000)
      
      imap.once('ready', () => {
        console.log('IMAP connection successful')
        connected = true
        clearTimeout(timeout)
        
        // Test folder listing
        imap.list('', '*', (err, boxes) => {
          imap.end()
          
          if (err) {
            console.log('Error listing folders:', err.message)
            resolve(NextResponse.json({
              success: true,
              connected: true,
              folders: [],
              folderError: err.message,
              config: {
                user: process.env.EMAIL_USER,
                host: process.env.EMAIL_HOST,
                port: parseInt(process.env.EMAIL_PORT) || 993,
                tls: process.env.EMAIL_TLS === 'true'
              }
            }))
          } else {
            const folders = boxes.map(box => box.name)
            console.log('Available folders:', folders)
            resolve(NextResponse.json({
              success: true,
              connected: true,
              folders: folders,
              config: {
                user: process.env.EMAIL_USER,
                host: process.env.EMAIL_HOST,
                port: parseInt(process.env.EMAIL_PORT) || 993,
                tls: process.env.EMAIL_TLS === 'true'
              }
            }))
          }
        })
      })
      
      imap.once('error', (err) => {
        console.log('IMAP connection error:', err.message)
        connected = true
        clearTimeout(timeout)
        imap.end()
        resolve(NextResponse.json({
          success: false,
          connected: false,
          error: err.message,
          config: {
            user: process.env.EMAIL_USER,
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT) || 993,
            tls: process.env.EMAIL_TLS === 'true'
          }
        }))
      })
      
      imap.once('end', () => {
        console.log('IMAP connection ended')
      })
      
      console.log('Connecting to IMAP server...')
      imap.connect()
    })
  } catch (error) {
    console.error('Error testing IMAP:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
