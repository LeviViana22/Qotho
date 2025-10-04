import { NextResponse } from 'next/server'
import { listDeletedEmails, softDeleteEmail } from '@/lib/serverEmail'

export async function GET() {
    try {
        const deletedEmails = listDeletedEmails()
        
        return NextResponse.json({
            success: true,
            deletedEmails: deletedEmails,
            count: deletedEmails.length
        })
    } catch (error) {
        console.error('Error getting deleted emails:', error)
        return NextResponse.json({
            success: false,
            error: error.message,
            deletedEmails: []
        }, { status: 500 })
    }
}

export async function POST() {
    try {
        // Create a test deleted email
        const testEmail = {
            id: 'email_test_deleted',
            name: 'Test User',
            title: 'Test Deleted Email',
            message: [{
                id: 'msg_test_deleted',
                name: 'Test User',
                content: 'This is a test deleted email',
                date: new Date().toLocaleDateString(),
                avatar: '/img/avatars/thumb-1.jpg'
            }],
            starred: false,
            flagged: false,
            checked: false,
            label: 'deleted',
            from: 'test@example.com',
            to: 'user@example.com',
            date: new Date().toISOString(),
            content: 'This is a test deleted email'
        }
        
        softDeleteEmail(testEmail)
        
        return NextResponse.json({
            success: true,
            message: 'Test deleted email created',
            email: testEmail
        })
    } catch (error) {
        console.error('Error creating test deleted email:', error)
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 })
    }
}
