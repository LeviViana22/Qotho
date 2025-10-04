import { NextResponse } from 'next/server'
import { testConnection } from '@/lib/serverEmail'

export async function POST(request) {
  try {
    const result = await testConnection()
    
    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(result, { status: 400 })
    }
  } catch (error) {
    console.error('Error testing email connection:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to test email connection' 
    }, { status: 500 })
  }
} 