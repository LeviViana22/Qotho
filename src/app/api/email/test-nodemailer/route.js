import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('Testing nodemailer import...')
    
    // Try different import methods
    let nodemailer
    try {
      nodemailer = require('nodemailer')
      console.log('NodeMailer imported successfully with require')
    } catch (error) {
      console.error('Require failed:', error)
      try {
        const nodemailerModule = await import('nodemailer')
        nodemailer = nodemailerModule.default
        console.log('NodeMailer imported successfully with dynamic import')
      } catch (error2) {
        console.error('Dynamic import failed:', error2)
        return NextResponse.json({ 
          error: 'NodeMailer import failed',
          requireError: error.message,
          importError: error2.message
        }, { status: 500 })
      }
    }
    
    // Test if createTransport exists
    if (typeof nodemailer.createTransport !== 'function') {
      console.error('createTransport is not a function')
      console.log('Available methods:', Object.keys(nodemailer))
      return NextResponse.json({ 
        error: 'createTransport is not a function',
        availableMethods: Object.keys(nodemailer)
      }, { status: 500 })
    }
    
    console.log('NodeMailer createTransport is available')
    
    return NextResponse.json({ 
      success: true, 
      message: 'NodeMailer createTransport is working correctly',
      availableMethods: Object.keys(nodemailer)
    })
  } catch (error) {
    console.error('Test failed:', error)
    return NextResponse.json({ 
      error: 'Test failed',
      details: error.message
    }, { status: 500 })
  }
}
