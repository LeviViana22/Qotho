import { NextResponse } from 'next/server'
import { fetchEmails } from '@/lib/serverEmail'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const folder = searchParams.get('folder') || 'INBOX'
    const limit = parseInt(searchParams.get('limit')) || 20
    const page = parseInt(searchParams.get('page')) || 1
    
    console.log('Fetching emails from folder:', folder, 'limit:', limit, 'page:', page)
    
    // Add timeout to prevent hanging requests
    const emails = await Promise.race([
      fetchEmails(folder, limit, page),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 60000)
      )
    ])
    
    console.log('Fetched', emails.length, 'emails from', folder, 'page:', page)
    console.log('Email IDs:', emails.map(email => email.id))
    
    // Get total count from cache if available, otherwise fetch it
    const cacheKey = `${folder}-${limit}-${page}`
    const { emailCache, getFolderEmailCount } = await import('@/lib/serverEmail')
    const cached = emailCache.get(cacheKey)
    let total = cached?.total || emails.length
    
    // If we don't have a total from cache, try to get it from the folder
    if (!cached?.total && emails.length > 0) {
      try {
        total = await getFolderEmailCount(folder)
      } catch (error) {
        console.log('Could not get folder count, using emails length:', error.message)
        total = emails.length
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      emails,
      folder,
      count: emails.length,
      total: total,
      page: page,
      pageSize: limit
    })
  } catch (error) {
    console.error('Error fetching emails:', error)
    
    // Return a more detailed error response
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch emails', 
      details: error.message,
      folder: searchParams?.get('folder') || 'INBOX',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
