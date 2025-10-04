import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    console.log('API: Received clear cache request')
    
    // Import the clearAllCaches function
    const { clearAllCaches } = await import('@/lib/serverEmail')
    
    const success = clearAllCaches()
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'All caches cleared successfully. Please refresh the page to see all emails restored.',
        instructions: [
          '1. Server-side caches have been cleared',
          '2. Deleted emails storage has been reset',
          '3. Please refresh your browser page',
          '4. All 103 emails should now be visible in your inbox'
        ]
      })
    } else {
      return NextResponse.json({ error: 'Failed to clear caches' }, { status: 500 })
    }
  } catch (error) {
    console.error('API: Error clearing caches:', error)
    return NextResponse.json({ error: 'Failed to clear caches' }, { status: 500 })
  }
}