import { fetchEmails, fetchEmailById } from '@/lib/serverEmail'

const getMail = async (params) => {
    try {
        if (!params.mail) {
            return {}
        }

        console.log('getMail called with params:', params)
        
        // Get the category/folder from params
        const category = params.category || 'inbox'
        const folderMap = {
            'inbox': 'INBOX',
            'sentItem': 'INBOX.Sent',
            'draft': 'INBOX.Drafts',
            'junk': 'INBOX.spam',
            'archive': 'INBOX.Archive',
            'deleted': 'INBOX.Trash'
        }
        const folder = folderMap[category] || 'INBOX'
        
        // Fetch only the requested email to avoid loading the entire mailbox
        console.log('Fetching single email from folder:', folder)
        const email = await Promise.race([
            fetchEmailById(folder, params.mail),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timeout')), 60000) // 60 second timeout for large emails
            )
        ])
        
        if (!email) {
            console.log('Email not found:', params.mail)
            return {}
        }

        console.log('Returning email:', email.id)
        console.log('Email structure:', {
            id: email.id,
            title: email.title,
            content: email.content?.substring(0, 100) + '...',
            contentLength: email.content?.length,
            messageCount: email.message?.length,
            firstMessageContent: email.message?.[0]?.content?.substring(0, 100) + '...',
            firstMessageContentLength: email.message?.[0]?.content?.length,
            attachmentCount: email.message?.[0]?.attachment?.length
        })
        return email
    } catch (error) {
        console.error('Error fetching mail:', error)
        return {}
    }
}

export default getMail
