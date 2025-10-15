import { NextResponse } from 'next/server'
import { removerEmail } from '@/lib/serverEmail'

export async function POST(request) {
  try {
    const { emailId, currentFolder, action = 'move_to_trash' } = await request.json()
    
    console.log('API: Received delete request:', { emailId, currentFolder, action })
    
    if (!emailId) {
      console.error('API: No emailId provided')
      return NextResponse.json({ error: 'Email ID is required' }, { status: 400 })
    }

    console.log('API: Calling removerEmail function')
    console.log('API: Email ID type:', typeof emailId, 'value:', emailId)
    console.log('API: Current folder:', currentFolder)
    console.log('API: Action:', action)
    
    const success = await removerEmail(emailId, currentFolder, action)
    console.log('API: removerEmail result:', success)
    console.log('API: removerEmail result type:', typeof success)

    if (success) {
      console.log('API: Delete successful, returning success response')
      return NextResponse.json({ success: true })
    } else {
      console.error('API: removerEmail returned false')
      console.error('API: This means the IMAP move operation failed')
      return NextResponse.json({ error: 'Failed to remove email - function returned false' }, { status: 500 })
    }
  } catch (error) {
    console.error('API: Error removing email:', error)
    console.error('API: Error stack:', error.stack)
    return NextResponse.json({ error: `Failed to remove email: ${error.message}` }, { status: 500 })
  }
}
