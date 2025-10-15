import { useMailStore } from '../_store/mailStore'
import { useSearchParams } from 'next/navigation'
import cloneDeep from 'lodash/cloneDeep'

const useMailAction = () => {
    const { mailList, setMail, setMailList, setSelectedMail, selectedCategory } = useMailStore()
    const searchParams = useSearchParams()

    const updateMailList = (newMail) => {
        const newMailList = cloneDeep(mailList).map((mail) => {
            if (mail.id === newMail.id) {
                mail = newMail
            }
            return mail
        })
        setMailList(newMailList)
    }

    const onStarToggle = (mail, shouldSetMail = true) => {
        const { toggleEmailStar } = useMailStore.getState()
        toggleEmailStar(mail.id)
        
        const newMail = cloneDeep(mail)
        newMail.starred = !newMail.starred
        if (shouldSetMail) {
            setMail(newMail)
        }
        updateMailList(newMail)
    }

    const onFlagToggle = async (mail, shouldSetMail = true) => {
        const newMail = cloneDeep(mail)
        newMail.flagged = !newMail.flagged
        if (shouldSetMail) {
            setMail(newMail)
        }
        updateMailList(newMail)
        
        // Persist flag status to server
        try {
            await fetch('/api/email/flag', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    emailId: mail.id, 
                    flagged: newMail.flagged 
                }),
            })
        } catch (e) {
            console.error('Failed to persist flag status:', e)
        }
    }

    const onCheckboxToggle = (mail) => {
        const newMail = cloneDeep(mail)
        newMail.checked = !newMail.checked
        updateMailList(newMail)
    }

    const onMoveMailClick = async (mail, destination) => {
        console.log(`onMoveMailClick: Moving email ${mail.id} to ${destination}`)
        
        // Get current category from URL parameters to determine source folder
        const currentCategory = searchParams.get('category') || 'inbox'
        console.log(`onMoveMailClick: URL category:`, searchParams.get('category'))
        console.log(`onMoveMailClick: currentCategory:`, currentCategory)
        
        // Map both source and destination to IMAP folder names
        const folderMap = {
            'inbox': 'INBOX',
            'sentItem': 'INBOX.Sent',
            'draft': 'INBOX.Draft',
            'starred': 'INBOX', // Starred emails stay in INBOX but are marked as starred
            'junk': 'INBOX.spam',
            'archive': 'INBOX.Archive'
        }
        
        const sourceFolder = folderMap[currentCategory] || 'INBOX'
        const targetFolder = folderMap[destination] || 'INBOX'
        
        console.log(`onMoveMailClick: Current category: ${currentCategory}`)
        console.log(`onMoveMailClick: Moving from ${sourceFolder} to ${targetFolder}`)
        
        // For starred emails, we don't actually move them, just mark them as starred
        if (destination === 'starred') {
            console.log('onMoveMailClick: Marking email as starred instead of moving')
            const { toggleEmailStar } = useMailStore.getState()
            toggleEmailStar(mail.id)
            
            const newMail = cloneDeep(mail)
            newMail.starred = true
            updateMailList(newMail)
            return
        }
        
        // For other destinations, use IMAP MOVE operation
        try {
            console.log(`onMoveMailClick: Making API call to /api/email/move`)
            console.log(`onMoveMailClick: Request data:`, { 
                emailId: mail.id,
                sourceFolder: sourceFolder,
                targetFolder: targetFolder
            })
            
            const response = await fetch('/api/email/move', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    emailId: mail.id,
                    sourceFolder: sourceFolder,
                    targetFolder: targetFolder
                }),
            })
            
            console.log(`onMoveMailClick: API response status:`, response.status)
            console.log(`onMoveMailClick: API response headers:`, response.headers)
            
            const result = await response.json()
            console.log('onMoveMailClick: Move result:', result)
            
            if (result.success) {
                console.log(`Successfully moved email ${mail.id} to ${destination}`)
                // Remove email from current list since it moved to another folder
                setMailList(mailList.filter(m => m.id !== mail.id))
            } else {
                console.error(`Failed to move email ${mail.id}:`, result.error)
            }
        } catch (error) {
            console.error('onMoveMailClick: Error moving email:', error)
        }
    }

    const onBatchMoveMailClick = async (mailsId, destination) => {
        console.log(`onBatchMoveMailClick: Moving ${mailsId.length} emails to ${destination}`)
        
        // Get current category from URL parameters to determine source folder
        const currentCategory = searchParams.get('category') || 'inbox'
        console.log(`onBatchMoveMailClick: URL category:`, searchParams.get('category'))
        console.log(`onBatchMoveMailClick: currentCategory:`, currentCategory)
        
        // Map both source and destination to IMAP folder names
        const folderMap = {
            'inbox': 'INBOX',
            'sentItem': 'INBOX.Sent',
            'draft': 'INBOX.Draft',
            'starred': 'INBOX', // Starred emails stay in INBOX but are marked as starred
            'junk': 'INBOX.spam',
            'archive': 'INBOX.Archive'
        }
        
        const sourceFolder = folderMap[currentCategory] || 'INBOX'
        const targetFolder = folderMap[destination] || 'INBOX'
        
        console.log(`onBatchMoveMailClick: Current category: ${currentCategory}`)
        console.log(`onBatchMoveMailClick: Moving from ${sourceFolder} to ${targetFolder}`)
        
        // For starred emails, we don't actually move them, just mark them as starred
        if (destination === 'starred') {
            console.log('onBatchMoveMailClick: Marking emails as starred instead of moving')
            const { toggleEmailStar } = useMailStore.getState()
            
            mailsId.forEach(emailId => {
                toggleEmailStar(emailId)
            })
            
            // Update local state
            setMailList(
                mailList.map((mail) => {
                    if (mailsId.includes(mail.id)) {
                        mail.starred = true
                        mail.checked = false
                    }
                    return mail
                }),
            )
            setSelectedMail([])
            return
        }
        
        // For other destinations, use IMAP MOVE operation for each email
        const movePromises = mailsId.map(async (emailId) => {
            try {
                console.log(`onBatchMoveMailClick: Making API call for email ${emailId}`)
                const response = await fetch('/api/email/move', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        emailId: emailId,
                        sourceFolder: sourceFolder,
                        targetFolder: targetFolder
                    }),
                })
                console.log(`onBatchMoveMailClick: API response status for ${emailId}:`, response.status)
                const result = await response.json()
                console.log(`onBatchMoveMailClick: Move result for ${emailId}:`, result)
                return { emailId, success: result.success }
            } catch (error) {
                console.error(`onBatchMoveMailClick: Error moving email ${emailId}:`, error)
                return { emailId, success: false }
            }
        })
        
        const results = await Promise.all(movePromises)
        const successfulMoves = results.filter(r => r.success).map(r => r.emailId)
        
        if (successfulMoves.length > 0) {
            console.log(`Successfully moved ${successfulMoves.length} emails to ${destination}`)
            // Remove successfully moved emails from current list
            setMailList(mailList.filter(mail => !successfulMoves.includes(mail.id)))
        }
        
        // Clear selection
        setSelectedMail([])
    }

    const onMailDelete = async (mailsId) => {
        // Get current category from URL parameters instead of store
        const currentFolder = searchParams.get('category') || 'inbox'
        
        console.log('onMailDelete: Starting delete process')
        console.log('onMailDelete: Email IDs to delete:', mailsId)
        console.log('onMailDelete: Current folder from URL:', currentFolder)
        console.log('onMailDelete: URL search params:', Object.fromEntries(searchParams.entries()))
        
        // Determine if emails should be moved to trash or deleted permanently
        const shouldMoveToTrash = ['inbox', 'sentItem', 'draft', 'archive'].includes(currentFolder)
        const shouldDeletePermanently = ['deleted', 'junk'].includes(currentFolder)
        
        console.log('onMailDelete: Should move to trash:', shouldMoveToTrash)
        console.log('onMailDelete: Should delete permanently:', shouldDeletePermanently)
        
        // Use store actions for client-side tracking
        const { deleteEmail, restoreEmail } = useMailStore.getState()
        
        // Mark emails as deleted in store
        for (const emailId of mailsId) {
            if (shouldMoveToTrash) {
                // Move to trash - mark as deleted in store
                console.log('useMailAction: Marking email as deleted in Zustand:', emailId)
                deleteEmail(emailId)
            } else if (shouldDeletePermanently) {
                // Permanently delete - remove from store
                console.log('useMailAction: Permanently deleting email from Zustand:', emailId)
                restoreEmail(emailId)
            }
        }
        
        // Use appropriate API for each email first, then update UI based on results
        const successfulDeletions = []
        
        try {
            for (const emailId of mailsId) {
                if (shouldMoveToTrash) {
                    // Move to trash folder
                    console.log(`onMailDelete: Moving email ${emailId} to trash from folder ${currentFolder}`)
                    const response = await fetch('/api/email/remover', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            emailId: emailId,
                            currentFolder: currentFolder,
                            action: 'move_to_trash'
                        }),
                    })
                    const result = await response.json()
                    console.log(`onMailDelete: Move to trash result for ${emailId}:`, result)
                    
                    if (result.success) {
                        successfulDeletions.push(emailId)
                    } else {
                        console.error(`Failed to move email ${emailId} to trash:`, result.error)
                    }
                } else if (shouldDeletePermanently) {
                    // Delete permanently
                    const response = await fetch('/api/email/remover', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            emailId: emailId,
                            currentFolder: currentFolder,
                            action: 'delete_permanently'
                        }),
                    })
                    const result = await response.json()
                    console.log('Permanent delete result:', result)
                    
                    if (result.success) {
                        successfulDeletions.push(emailId)
                    } else {
                        console.error(`Failed to permanently delete email ${emailId}:`, result.error)
                    }
                }
            }
            
            // Only update UI for successfully processed emails
            if (successfulDeletions.length > 0) {
                console.log(`Successfully processed ${successfulDeletions.length} out of ${mailsId.length} emails`)
                setMailList(mailList.filter((mail) => !successfulDeletions.includes(mail.id)))
                setSelectedMail([])
            } else {
                console.error('No emails were successfully processed')
            }
            
        } catch (e) {
            console.error('Failed to remove emails:', e)
        }
    }

    const onResetChecked = () => {
        setMailList(
            mailList.map((mail) => {
                mail.checked = false
                return mail
            }),
        )
        setSelectedMail([])
    }

    return {
        onStarToggle,
        onMailDelete,
        onFlagToggle,
        onMoveMailClick,
        onCheckboxToggle,
        onResetChecked,
        onBatchMoveMailClick,
    }
}

export default useMailAction
