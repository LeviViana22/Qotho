import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    console.log('API: /api/email/move endpoint called')
    const { emailId, sourceFolder, targetFolder } = await request.json()
    
    console.log('API: Received move request:', { emailId, sourceFolder, targetFolder })
    
    if (!emailId || !sourceFolder || !targetFolder) {
      console.log('API: Missing required parameters')
      return NextResponse.json({ error: 'Email ID, source folder, and target folder are required' }, { status: 400 })
    }

    // Extract UID from emailId (assuming format like "email_123")
    const uid = emailId.replace('email_', '')
    console.log('API: Extracted UID:', uid)

    console.log('API: Importing performImapMove function...')
    // Import the performImapMove function
    const { performImapMove } = await import('@/lib/serverEmail')
    
    console.log('API: Calling performImapMove with UID:', uid)
    const success = await performImapMove(uid, sourceFolder, targetFolder)
    console.log('API: performImapMove result:', success)
    
    if (success) {
      console.log('API: Move successful, returning success response')
      return NextResponse.json({ success: true, message: `Email moved from ${sourceFolder} to ${targetFolder}` })
    } else {
      console.log('API: Move failed, returning error response')
      return NextResponse.json({ error: 'Failed to move email' }, { status: 500 })
    }
  } catch (error) {
    console.error('API: Error moving email:', error)
    return NextResponse.json({ error: 'Failed to move email' }, { status: 500 })
  }
}
