import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    console.log('API: Received clear client cache request')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Client cache cleanup instructions',
      instructions: [
        'Run this in your browser console to clear client-side cache:',
        '',
        '// Clear localStorage',
        'localStorage.removeItem("mail_read_ids")',
        'localStorage.removeItem("mail_read_fingerprints")', 
        'localStorage.removeItem("mail_flagged_ids")',
        'localStorage.removeItem("mail_starred_ids")',
        'localStorage.removeItem("mail_deleted_ids")',
        '',
        '// Clear Zustand store (if accessible)',
        '// This will be cleared when you refresh the page',
        '',
        '// Then refresh the page',
        'window.location.reload()'
      ],
      consoleCommands: [
        'localStorage.removeItem("mail_read_ids")',
        'localStorage.removeItem("mail_read_fingerprints")', 
        'localStorage.removeItem("mail_flagged_ids")',
        'localStorage.removeItem("mail_starred_ids")',
        'localStorage.removeItem("mail_deleted_ids")',
        'window.location.reload()'
      ]
    })
  } catch (error) {
    console.error('API: Error providing client cache instructions:', error)
    return NextResponse.json({ error: 'Failed to provide instructions' }, { status: 500 })
  }
}
