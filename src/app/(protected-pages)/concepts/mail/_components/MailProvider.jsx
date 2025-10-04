'use client'
import { useEffect } from 'react'
import { useMailStore } from '../_store/mailStore'

const MailProvider = ({ children, mailList }) => {
    const setMailList = useMailStore((state) => state.setMailList)
    const setMailListFetched = useMailStore((state) => state.setMailListFetched)

    useEffect(() => {
        if (mailList) {
            // Handle new pagination structure
            if (mailList.emails && Array.isArray(mailList.emails)) {
                console.log('MailProvider: Setting mailList with', mailList.emails.length, 'emails')
                console.log('MailProvider: Email IDs:', mailList.emails.map(email => email.id))
                setMailList(mailList.emails)
                
                // Set pagination info if available
                if (mailList.pagination) {
                    const { setPagination } = useMailStore.getState()
                    console.log('MailProvider: Setting pagination from server:', mailList.pagination)
                    setPagination(mailList.pagination)
                }
                
                setMailListFetched(true)
            } else {
                // Handle legacy structure (just array of emails)
                console.log('MailProvider: Setting mailList with', mailList.length, 'emails (legacy format)')
                console.log('MailProvider: Email IDs:', mailList.map(email => email.id))
                setMailList(mailList)
                setMailListFetched(true)
            }
        } else {
            console.log('MailProvider: No mailList provided (viewing specific email)')
            setMailList([])
            setMailListFetched(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mailList])

    return <>{children}</>
}

export default MailProvider
