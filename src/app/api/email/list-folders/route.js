import { NextResponse } from 'next/server'
import { listAvailableFolders } from '@/lib/serverEmail'

export async function GET() {
    try {
        console.log('Listing available IMAP folders...')
        const folders = await listAvailableFolders()
        
        return NextResponse.json({
            success: true,
            folders: folders,
            count: folders.length
        })
    } catch (error) {
        console.error('Error listing folders:', error)
        return NextResponse.json({
            success: false,
            error: error.message,
            folders: []
        }, { status: 500 })
    }
}