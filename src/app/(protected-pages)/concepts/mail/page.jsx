import MailEditor from './_components/MailEditor'
import MailProvider from './_components/MailProvider'
import MailBody from './_components/MailBody'
import EmailPerformanceMonitor from './_components/EmailPerformanceMonitor'
import getMail from '@/server/actions/getMail'
import getMailList from '@/server/actions/getMailList'

export default async function Page({ searchParams }) {
    const params = await searchParams

    // Only fetch mail list if we're not viewing a specific email
    const mail = await getMail(params)
    const mailList = params.mail ? null : await getMailList({
        ...params,
        page: params.page || 1,
        pageSize: 20
    })
    
    // Debug: Log what we're getting from getMail
    console.log('Page - mail data received:', {
        mailId: mail?.id,
        mailTitle: mail?.title,
        mailContent: mail?.content?.substring(0, 100) + '...',
        mailContentLength: mail?.content?.length,
        messageCount: mail?.message?.length,
        firstMessageContent: mail?.message?.[0]?.content?.substring(0, 100) + '...',
        firstMessageContentLength: mail?.message?.[0]?.content?.length,
        attachmentCount: mail?.message?.[0]?.attachment?.length
    })
    
    // Debug: Log what we're getting from getMailList
    if (mailList) {
        console.log('Page - mailList data received:', {
            emailsCount: mailList.emails?.length || mailList.length,
            pagination: mailList.pagination,
            isNewFormat: !!mailList.emails
        })
    }

    return (
        <MailProvider mailList={mailList}>
            {/* <EmailPerformanceMonitor /> */}
            <MailBody mail={mail} />
            <MailEditor />
        </MailProvider>
    )
}
