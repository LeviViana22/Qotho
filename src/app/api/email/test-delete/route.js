import { NextResponse } from 'next/server'
import { listAvailableFolders, performImapMove } from '@/lib/serverEmail'

export async function GET() {
  try {
    console.log('Testing delete functionality...')
    
    // First, list available folders to see what trash folder is available
    console.log('Getting available folders...')
    const folders = await listAvailableFolders()
    console.log('Available folders:', folders)
    
    // Find trash folder
    const trashFolderPatterns = ['trash', 'deleted', 'junk', 'bin']
    let trashFolder = null
    
    for (const folder of folders) {
      const folderLower = folder.toLowerCase()
      for (const pattern of trashFolderPatterns) {
        if (folderLower.includes(pattern)) {
          trashFolder = folder
          break
        }
      }
      if (trashFolder) break
    }
    
    return NextResponse.json({
      success: true,
      availableFolders: folders,
      foundTrashFolder: trashFolder,
      message: trashFolder ? `Found trash folder: ${trashFolder}` : 'No trash folder found'
    })
  } catch (error) {
    console.error('Error testing delete functionality:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { emailId, sourceFolder = 'INBOX' } = await request.json()
    
    if (!emailId) {
      return NextResponse.json({ error: 'Email ID is required' }, { status: 400 })
    }
    
    console.log(`Testing move for email ${emailId} from ${sourceFolder}`)
    
    // Get available folders first
    const folders = await listAvailableFolders()
    console.log('Available folders:', folders)
    
    // Find trash folder
    const trashFolderPatterns = ['trash', 'deleted', 'junk', 'bin']
    let trashFolder = null
    
    for (const folder of folders) {
      const folderLower = folder.toLowerCase()
      for (const pattern of trashFolderPatterns) {
        if (folderLower.includes(pattern)) {
          trashFolder = folder
          break
        }
      }
      if (trashFolder) break
    }
    
    if (!trashFolder) {
      return NextResponse.json({
        success: false,
        error: 'No trash folder found',
        availableFolders: folders
      })
    }
    
    // Extract UID from emailId
    const uid = emailId.replace('email_', '')
    console.log(`Testing move of UID ${uid} from ${sourceFolder} to ${trashFolder}`)
    
    // Test the move operation
    const result = await performImapMove(uid, sourceFolder, trashFolder)
    console.log('Move result:', result)
    
    return NextResponse.json({
      success: result,
      emailId,
      sourceFolder,
      targetFolder: trashFolder,
      uid,
      message: result ? 'Move successful' : 'Move failed'
    })
  } catch (error) {
    console.error('Error testing move:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
