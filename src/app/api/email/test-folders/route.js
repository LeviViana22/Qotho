import { NextResponse } from 'next/server'
import { fetchEmails } from '@/lib/serverEmail'

export async function GET() {
    try {
        console.log('Testing folder access...')
        
        // Test INBOX first (should work)
        console.log('Testing INBOX...')
        const inboxEmails = await fetchEmails('INBOX', 5, 1)
        console.log('INBOX result:', inboxEmails.length, 'emails')
        
        // Test INBOX.spam
        console.log('Testing INBOX.spam...')
        const spamEmails = await fetchEmails('INBOX.spam', 5, 1)
        console.log('INBOX.spam result:', spamEmails.length, 'emails')
        
        // Test INBOX.Trash
        console.log('Testing INBOX.Trash...')
        const trashEmails = await fetchEmails('INBOX.Trash', 5, 1)
        console.log('INBOX.Trash result:', trashEmails.length, 'emails')
        
        return NextResponse.json({
            success: true,
            results: {
                inbox: inboxEmails.length,
                spam: spamEmails.length,
                trash: trashEmails.length
            }
        })
    } catch (error) {
        console.error('Error testing folders:', error)
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 })
    }
}
