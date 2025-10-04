import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    console.log('API: Received clear Zustand request')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Zustand store cleanup instructions',
      instructions: [
        'Run this in your browser console to clear the Zustand store:',
        '',
        '// Clear all deleted IDs from Zustand store',
        'const { clearAllDeletedIds } = useMailStore.getState()',
        'clearAllDeletedIds()',
        '',
        '// Also clear localStorage just in case',
        'localStorage.removeItem("mail_deleted_ids")',
        '',
        '// Refresh the page',
        'window.location.reload()'
      ],
      consoleCommands: [
        'const { clearAllDeletedIds } = useMailStore.getState()',
        'clearAllDeletedIds()',
        'localStorage.removeItem("mail_deleted_ids")',
        'window.location.reload()'
      ]
    })
  } catch (error) {
    console.error('API: Error providing Zustand cleanup instructions:', error)
    return NextResponse.json({ error: 'Failed to provide instructions' }, { status: 500 })
  }
}
