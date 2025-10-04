import { fetchEmails, getSentEmails, listDeletedEmails } from '@/lib/serverEmail'

const getMailList = async (params) => {
    try {
        console.log('getMailList called with params:', params)
        
        const category = params.category || 'inbox'
        const page = parseInt(params.page) || 1
        const pageSize = parseInt(params.pageSize) || 20
        
        // Map UI categories to IMAP folders
        // This IMAP server requires folder names to be prefixed with "INBOX."
        const folderMap = {
            'inbox': 'INBOX',
            'sentItem': ['INBOX.Sent', 'INBOX.Sent Items', 'INBOX.SentMail', 'INBOX.Sent Mail', 'INBOX.Envoyés', 'Sent', 'Sent Items', 'SentMail', 'Sent Mail', 'Envoyés'],
            'draft': ['INBOX.Drafts', 'INBOX.Draft', 'INBOX.Brouillons', 'Drafts', 'Draft', 'Brouillons'],
            'starred': 'INBOX', // Will be filtered client-side
            'junk': ['INBOX.spam', 'Spam', 'INBOX.Spam', 'Junk', 'INBOX.Junk'],
            'archive': ['INBOX.Archive', 'INBOX.Archives'],
            'deleted': ['INBOX.Trash', 'INBOX.Deleted', 'INBOX.Deleted Items', 'INBOX.Corbeille']
        }
        
        const folderNames = folderMap[category] || 'INBOX'
        const folders = Array.isArray(folderNames) ? folderNames : [folderNames]
        
        // Try each folder name until one works
        let emails = []
        
        // For deleted folder, always try to get emails from IMAP first
        for (const folder of folders) {
            try {
                console.log('Trying to fetch emails from folder:', folder)
                // Add timeout to prevent hanging requests
                emails = await Promise.race([
                    fetchEmails(folder, pageSize, page), // Pass page parameter for pagination
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Request timeout')), 10000) // 10 second timeout
                    )
                ])
                console.log(`Successfully found ${emails.length} emails in folder: ${folder}`)
                break // Stop trying other folders if we found emails or successfully connected
            } catch (error) {
                console.log(`Failed to fetch from folder ${folder}:`, error.message)
                // If it's a "nonexistent namespace" or "doesn't exist" error, try next folder
                if (error.message.includes('nonexistent namespace') || 
                    error.message.includes('should probably be prefixed') ||
                    error.message.includes("doesn't exist")) {
                    console.log(`Folder ${folder} doesn't exist, trying next folder...`)
                    continue
                }
                // For other errors (timeout, connection), also try next folder
                continue
            }
        }
        
        // For deleted folder, also add client-side deleted emails
        if (category === 'deleted') {
            console.log('=== DELETED FOLDER DEBUG ===')
            console.log('IMAP emails found:', emails.length)
            console.log('IMAP email IDs:', emails.map(e => e.id))
            
            const clientDeletedEmails = listDeletedEmails()
            console.log('Client-side deleted emails:', clientDeletedEmails.length, 'emails')
            console.log('Client-side deleted email IDs:', clientDeletedEmails.map(e => e.id))
            
            // Merge IMAP emails with client-side deleted emails
            const existingIds = new Set(emails.map(e => e.id))
            const newClientEmails = clientDeletedEmails.filter(e => !existingIds.has(e.id))
            emails = [...emails, ...newClientEmails]
            console.log(`Total deleted emails (IMAP + client): ${emails.length}`)
            console.log('Final email IDs:', emails.map(e => e.id))
            console.log('=== END DELETED FOLDER DEBUG ===')
        }
        
        // If no sent folder found on IMAP, use local sent emails storage
        if (category === 'sentItem' && emails.length === 0) {
            console.log('No IMAP sent folder found, using local sent emails storage')
            emails = getSentEmails()
        }
        
        // If no junk folder found on IMAP, return empty array (no local storage for junk)
        if (category === 'junk' && emails.length === 0) {
            console.log('No IMAP junk folder found, returning empty array')
        }
        
        // If no archive folder found on IMAP, return empty array (no local storage for archive)
        if (category === 'archive' && emails.length === 0) {
            console.log('No IMAP archive folder found, returning empty array')
        }
        
        // If no trash folder found on IMAP, fall back to local deleted emails storage
        if (category === 'deleted' && emails.length === 0) {
            console.log('No IMAP trash folder found, using local deleted emails storage')
            emails = listDeletedEmails()
        }
        
        console.log('Returning', emails.length, 'emails for category:', category, 'page:', page)
        console.log('Email IDs:', emails.map(email => email.id))
        
        // Get total count from first email if available
        const totalCount = emails.length > 0 ? (emails[0].total || emails[0].folderTotal || emails.length) : 0
        
        console.log('Returning emails with pagination:', {
            emailsCount: emails.length,
            totalCount,
            currentPage: page,
            pageSize: pageSize
        })
        
        // Return emails with pagination info
        return {
            emails: emails,
            pagination: {
                currentPage: page,
                pageSize: pageSize,
                total: totalCount,
                totalPages: Math.ceil(totalCount / pageSize)
            }
        }
    } catch (error) {
        console.error('Error fetching mail list:', error)
        return []
    }
}

export default getMailList
