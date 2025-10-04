import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    console.log('API: Received cleanup fake entries request')
    
    // Import the cleanupFakeDeletedEmails function
    const { cleanupFakeDeletedEmails } = await import('@/lib/serverEmail')
    
    const removedCount = cleanupFakeDeletedEmails()
    
    return NextResponse.json({ 
      success: true, 
      message: `Cleaned up ${removedCount} fake deleted email entries`,
      removedCount: removedCount
    })
  } catch (error) {
    console.error('API: Error cleaning up fake entries:', error)
    return NextResponse.json({ error: 'Failed to clean up fake entries' }, { status: 500 })
  }
}
