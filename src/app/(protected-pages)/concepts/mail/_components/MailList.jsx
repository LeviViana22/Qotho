'use client'
import { useState, useEffect } from 'react'
import Avatar from '@/components/ui/Avatar'
import ScrollBar from '@/components/ui/ScrollBar'
import Loading from '@/components/shared/Loading'
import Table from '@/components/ui/Table'
import Checkbox from '@/components/ui/Checkbox'
import Badge from '@/components/ui/Badge'
import Pagination from '@/components/ui/Pagination'
import MailDeleteConfimation from './MailDeleteConfimation'
import classNames from '@/utils/classNames'
import { useMailStore } from '../_store/mailStore'
import useMailAction from '../_hooks/useMailAction'
// Removed labelList import - no longer using colored circles
import isLastChild from '@/utils/isLastChild'
import { useRouter, useSearchParams } from 'next/navigation'
import { TbStarFilled, TbTrash, TbStar, TbFlag, TbUser } from 'react-icons/tb'

const htmlReg = /(<([^>]+)>)/gi

const { THead, Th, TBody, Tr, Td } = Table

const MailList = () => {
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState({
        open: false,
        selected: '',
    })

    // Get read status from Zustand store
    const readIds = useMailStore((state) => state.readIds)
    const readFingerprints = useMailStore((state) => state.readFingerprints)
    const setReadIds = useMailStore((state) => state.setReadIds)
    const setReadFingerprints = useMailStore((state) => state.setReadFingerprints)
    const markEmailAsRead = useMailStore((state) => state.markEmailAsRead)
    
    // Get flagged status from Zustand store
    const flaggedIds = useMailStore((state) => state.flaggedIds)
    const setFlaggedIds = useMailStore((state) => state.setFlaggedIds)
    const toggleEmailFlag = useMailStore((state) => state.toggleEmailFlag)
    
    // Get starred status from Zustand store
    const starredIds = useMailStore((state) => state.starredIds)
    const setStarredIds = useMailStore((state) => state.setStarredIds)
    const toggleEmailStar = useMailStore((state) => state.toggleEmailStar)
    
    // Get deleted status from Zustand store
    const deletedIds = useMailStore((state) => state.deletedIds)
    const setDeletedIds = useMailStore((state) => state.setDeletedIds)
    

    // Helper to compute a stable fingerprint for an email
    const getMailFp = (mail) => {
        const from = mail?.from || mail?.name || ''
        const title = mail?.title || ''
        // Use a simple date string without parsing to avoid huge date objects
        const dateStr = mail?.date || mail?.message?.[0]?.date || ''
        return `${from}|${title}|${dateStr}`
    }

    // Initialize read IDs & fingerprints from localStorage on mount
    useEffect(() => {
        try {
            const storedIds = localStorage.getItem('mail_read_ids')
            if (storedIds) {
                const arr = JSON.parse(storedIds)
                if (Array.isArray(arr)) {
                    setReadIds(new Set(arr))
                }
            }
            const storedFp = localStorage.getItem('mail_read_fp')
            if (storedFp) {
                const arr = JSON.parse(storedFp)
                if (Array.isArray(arr)) {
                    setReadFingerprints(new Set(arr))
                }
            }
            const storedFlagged = localStorage.getItem('mail_flagged_ids')
            if (storedFlagged) {
                const arr = JSON.parse(storedFlagged)
                if (Array.isArray(arr)) {
                    setFlaggedIds(new Set(arr))
                }
            }
            const storedStarred = localStorage.getItem('mail_starred_ids')
            if (storedStarred) {
                const arr = JSON.parse(storedStarred)
                if (Array.isArray(arr)) {
                    setStarredIds(new Set(arr))
                }
            }
            const storedDeleted = localStorage.getItem('mail_deleted_ids')
            if (storedDeleted) {
                const arr = JSON.parse(storedDeleted)
                if (Array.isArray(arr)) {
                    setDeletedIds(new Set(arr))
                }
            }
        } catch (error) {
            console.error('Error loading from localStorage:', error)
        }
    }, [setReadIds, setReadFingerprints, setFlaggedIds, setStarredIds, setDeletedIds])

    // Persist read IDs & fingerprints when they change
    useEffect(() => {
        try {
            const idsArray = Array.from(readIds)
            const fpArray = Array.from(readFingerprints)
            localStorage.setItem('mail_read_ids', JSON.stringify(idsArray))
            localStorage.setItem('mail_read_fp', JSON.stringify(fpArray))
        } catch (error) {
            console.error('Error saving to localStorage:', error)
        }
    }, [readIds, readFingerprints])

    const selectedMailId = useMailStore((state) => state.selectedMailId)
    const setMail = useMailStore((state) => state.setMail)
    const mailList = useMailStore((state) => state.mailList)
    const mailListFetched = useMailStore((state) => state.mailListFetched)
    const setSelectedMail = useMailStore((state) => state.setSelectedMail)
    const pagination = useMailStore((state) => state.pagination)
    const setPagination = useMailStore((state) => state.setPagination)
    const setCurrentPage = useMailStore((state) => state.setCurrentPage)

    const router = useRouter()
    const searchParams = useSearchParams()
    
    // Get current category from URL params
    const currentCategory = searchParams.get('category') || 'inbox'
    
    // Filter mailList based on category and deleted status
    let filteredMailList
    
    // Debug logging
    console.log('MailList filtering debug:', {
        currentCategory,
        mailListLength: mailList.length,
        deletedIdsSize: deletedIds.size,
        deletedIds: Array.from(deletedIds),
        starredIdsSize: starredIds.size,
        starredIds: Array.from(starredIds)
    })
    
    if (currentCategory === 'deleted') {
        // In trash folder: show emails that are either originally from trash OR marked as deleted
        // For deleted folder, we want to show ALL emails from the server (which are from IMAP trash)
        // PLUS any emails that were deleted locally
        filteredMailList = mailList.filter(mail => {
            const isFromImapTrash = true // All emails in this folder are from IMAP trash
            const isLocallyDeleted = deletedIds.has(mail.id)
            const shouldShow = isFromImapTrash || isLocallyDeleted
            
            console.log(`Email ${mail.id}: isFromImapTrash=${isFromImapTrash}, isLocallyDeleted=${isLocallyDeleted}, shouldShow=${shouldShow}`)
            return shouldShow
        })
    } else if (currentCategory === 'starred') {
        // Show only starred emails (excluding deleted ones)
        filteredMailList = mailList.filter(mail => starredIds.has(mail.id) && !deletedIds.has(mail.id))
    } else {
        // Show all emails except deleted ones
        filteredMailList = mailList.filter(mail => !deletedIds.has(mail.id))
    }
    
    console.log('Filtered mail list length:', filteredMailList.length)

    const {
        onFlagToggle,
        onCheckboxToggle,
        onStarToggle,
        onResetChecked,
        onMailDelete,
    } = useMailAction()

    const renderSubject = (title, content, isRead = false, isFlagged = false) => {
        const text = content.replace(htmlReg, '')
        const titleOffsetNumber = title.length

        return (
            <div className="flex items-center gap-3 min-w-0">
                <span className={`${isRead ? '!font-normal' : '!font-semibold'} heading-text truncate flex-shrink-0 ${isFlagged ? 'text-red-500' : ''}`}>
                    {title.length > 60 ? title.substring(0, 57) + '...' : title}
                </span>
                <span className={`${isRead ? '!font-normal' : '!font-medium'} truncate min-w-0 ${isFlagged ? 'text-red-500' : ''}`}>
                    {text.length > 120 - titleOffsetNumber
                        ? text.substring(0, 117 - titleOffsetNumber) + '...'
                        : text}
                </span>
            </div>
        )
    }

    const formatEmailDate = (dateString) => {
        if (!dateString) return 'No date'
        
        try {
            // Try to parse the date string
            let emailDate = new Date(dateString)
            
            // If the date is invalid, try to parse it as a different format
            if (isNaN(emailDate.getTime())) {
                // Try parsing as ISO string or other common formats
                emailDate = new Date(dateString.replace(/\s+/g, ' ').trim())
            }
            
            // If still invalid, try to parse common email date formats
            if (isNaN(emailDate.getTime())) {
                // Try to parse common email date formats like "Mon, 2 Sep 2024 17:00:00 +0000"
                const emailDateMatch = dateString.match(/(\d{1,2})\s+(\w{3})\s+(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/)
                if (emailDateMatch) {
                    const [, day, month, year, hour, minute] = emailDateMatch
                    const monthMap = {
                        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
                        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
                    }
                    emailDate = new Date(parseInt(year), monthMap[month], parseInt(day), parseInt(hour), parseInt(minute))
                }
            }
            
            // If still invalid, try to parse as a simple date string
            if (isNaN(emailDate.getTime())) {
                // Try to extract date parts manually
                const dateMatch = dateString.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/)
                if (dateMatch) {
                    const [, year, month, day, hour, minute] = dateMatch
                    emailDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute))
                }
            }
            
            // If still invalid, try to create a date from current time as fallback
            if (isNaN(emailDate.getTime())) {
                // If it looks like a time-only string (HH:MM), use today's date
                if (dateString.match(/^\d{1,2}:\d{2}$/)) {
                    const now = new Date()
                    const [hours, minutes] = dateString.split(':')
                    emailDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(hours), parseInt(minutes))
                } else {
                    emailDate = new Date()
                }
            }
            
            // Format as DD/MM/YY HH:MM
            const day = emailDate.getDate().toString().padStart(2, '0')
            const month = (emailDate.getMonth() + 1).toString().padStart(2, '0')
            const year = emailDate.getFullYear().toString().slice(-2)
            const hours = emailDate.getHours().toString().padStart(2, '0')
            const minutes = emailDate.getMinutes().toString().padStart(2, '0')
            
            return `${day}/${month}/${year} ${hours}:${minutes}`
        } catch (error) {
            return dateString
        }
    }

    const handleMailClick = (e, mail) => {
        console.log('Mail clicked:', mail.id, mail.title)
        console.log('Mail structure:', mail)
        e.stopPropagation()

        // Mark as read using Zustand store
        const fp = getMailFp(mail)
        markEmailAsRead(mail.id, fp)

        setMail(mail)
        onResetChecked()

        const param = {
            mail: mail.id,
        }

        const params = ['label', 'category']

        params.forEach((key) => {
            if (searchParams.get(key)) {
                param[key] = searchParams.get(key)
            }
        })

        console.log('Navigating to:', `concepts/mail?${new URLSearchParams(param).toString()}`)
        router.push(`/concepts/mail?${new URLSearchParams(param).toString()}`)
    }

    const handleCheckboxClick = (e, mail) => {
        e.stopPropagation()
        onCheckboxToggle(mail)
        if (!mail.checked) {
            if (!selectedMailId.includes(mail.id)) {
                setSelectedMail([...selectedMailId, mail.id])
            }
        } else {
            setSelectedMail(selectedMailId.filter((id) => mail.id !== id))
        }
    }

    const handleAction = (e, callback, mail) => {
        e.stopPropagation()
        callback(mail, false)
    }

    const handleClose = () => {
        setDeleteConfirmationOpen({
            open: false,
            selected: '',
        })
    }

    const handleConfirmDelete = () => {
        onMailDelete([deleteConfirmationOpen.selected])
        handleClose()
    }

    const handlePaginationChange = async (page) => {
        console.log('Pagination changed to page:', page)
        setCurrentPage(page)
        // Reset checked emails when changing pages
        onResetChecked()
        
        // Fetch emails for the new page
        try {
            const searchParams = new URLSearchParams(window.location.search)
            searchParams.set('page', page.toString())
            
            // Update URL without navigation
            const newUrl = `${window.location.pathname}?${searchParams.toString()}`
            window.history.pushState({}, '', newUrl)
            
            // Fetch new emails for the page
            const response = await fetch(`/api/email/fetch?folder=INBOX&limit=20&page=${page}`)
            if (response.ok) {
                const data = await response.json()
                if (data.success) {
                    console.log('Fetched emails for page:', page, 'Total:', data.total, 'Count:', data.count)
                    
                    // Update the mail list with new emails
                    const { setMailList } = useMailStore.getState()
                    setMailList(data.emails)
                    
                    // Update pagination info with the actual total from server
                    setPagination({
                        currentPage: page,
                        pageSize: 20,
                        total: data.total || data.emails.length,
                        totalPages: Math.ceil((data.total || data.emails.length) / 20)
                    })
                }
            }
        } catch (error) {
            console.error('Error fetching emails for page:', page, error)
        }
    }

    // Update pagination when mailList changes
    useEffect(() => {
        if (mailList && mailList.length > 0) {
            // Get total from the first email if available, otherwise estimate
            const firstEmail = mailList[0]
            const totalFromEmail = firstEmail?.total || firstEmail?.folderTotal
            const estimatedTotal = totalFromEmail || Math.max(mailList.length + (pagination.currentPage - 1) * pagination.pageSize, mailList.length)
            const totalPages = Math.ceil(estimatedTotal / pagination.pageSize)
            
            console.log('Updating pagination:', {
                mailListLength: mailList.length,
                currentPage: pagination.currentPage,
                totalFromEmail,
                estimatedTotal,
                totalPages,
                firstEmailKeys: firstEmail ? Object.keys(firstEmail) : []
            })
            
            setPagination({
                total: estimatedTotal,
                totalPages: totalPages
            })
        }
    }, [mailList, pagination.currentPage, pagination.pageSize, setPagination])

    return (
        <>
            <div className="lg:absolute top-0 left-0 h-full w-full">
                <ScrollBar
                    autoHide
                    className="overflow-y-auto lg:h-full lg:max-w-full"
                >
                    <Loading
                        type={filteredMailList.length > 0 ? 'cover' : 'default'}
                        spinnerClass={filteredMailList.length > 0 ? 'hidden' : ''}
                        loading={!mailListFetched}
                    >
                        {filteredMailList.length === 0 && mailListFetched ? (
                            <div className="flex items-center justify-center h-32 text-gray-500">
                                <p>No emails found</p>
                            </div>
                        ) : (
                            <>
                                <Table
                            compact
                            overflow={false}
                            className="hidden lg:table"
                        >
                            <THead>
                                <Tr>
                                    <Th colSpan={2} className="w-48 min-w-48 max-w-48">Rementente</Th>
                                    <Th></Th>
                                    <Th>Assunto</Th>
                                    <Th className="min-w-40 w-40">Data</Th>
                                    <Th></Th>
                                </Tr>
                            </THead>
                            <TBody>
                                {filteredMailList.map((mail) => {
                                    const fp = getMailFp(mail)
                                    const isRead = readIds.has(mail.id) || readFingerprints.has(fp)
                                    const isFlagged = flaggedIds.has(mail.id)
                                    return (
                                    <Tr
                                        key={mail.id}
                                        className="group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                                        onClick={(e) =>
                                            handleMailClick(e, mail)
                                        }
                                    >
                                        <Td width="40">
                                            <div className="h-[32px] w-[32px] flex items-center justify-center">
                                                <Avatar
                                                    shape="circle"
                                                    size="sm"
                                                    icon={<TbUser />}
                                                    className={classNames(
                                                        'group-hover:hidden',
                                                        mail.checked &&
                                                            'hidden',
                                                    )}
                                                />
                                                <div
                                                    className={classNames(
                                                        'group-hover:block',
                                                        mail.checked
                                                            ? 'block'
                                                            : 'hidden',
                                                    )}
                                                >
                                                    <div
                                                        className="flex items-center"
                                                        onClick={(e) =>
                                                            handleCheckboxClick(
                                                                e,
                                                                mail,
                                                            )
                                                        }
                                                    >
                                                        <Checkbox
                                                            checked={
                                                                mail.checked
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </Td>
                                        <Td className="w-48 min-w-48 max-w-48">
                                            <span className={`${isRead ? '!font-normal' : '!font-semibold'} heading-text truncate block ${isFlagged ? 'text-red-500' : ''}`}>
                                                {mail.name}
                                            </span>
                                        </Td>
                                        <Td>
                                            {/* Removed colored circles - these are folders, not labels */}
                                        </Td>
                                        <Td className="max-w-0 w-full">
                                            {mail.message && mail.message[0] ? (
                                                renderSubject(
                                                    mail.title,
                                                    mail.message[0].content,
                                                    isRead,
                                                    isFlagged
                                                )
                                            ) : (
                                                <span className={`text-gray-500 ${isFlagged ? 'text-red-500' : ''}`}>No content</span>
                                            )}
                                        </Td>
                                        <Td className={`min-w-40 w-40 ${isFlagged ? 'text-red-500' : ''}`}>
                                            {mail.message && mail.message[0] && mail.message[0].date ? 
                                                formatEmailDate(mail.message[0].date) : 'No date'}
                                        </Td>
                                        <Td>
                                            <div className="flex items-center text-lg gap-2">
                                                <button
                                                    type="button"
                                                    title="Marcar"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        toggleEmailFlag(mail.id)
                                                    }}
                                                >
                                                    <TbFlag className={classNames(
                                                        "text-lg",
                                                        isFlagged ? "text-red-500" : "text-gray-400"
                                                    )} />
                                                </button>
                                                <button
                                                    type="button"
                                                    title="Favoritar"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        toggleEmailStar(mail.id)
                                                    }}
                                                >
                                                    {starredIds.has(mail.id) ? (
                                                        <TbStarFilled className="text-amber-500" />
                                                    ) : (
                                                        <TbStar />
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    title="Remover"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setDeleteConfirmationOpen(
                                                            {
                                                                open: true,
                                                                selected:
                                                                    mail.id,
                                                            },
                                                        )
                                                    }}
                                                >
                                                    <TbTrash />
                                                </button>
                                            </div>
                                        </Td>
                                    </Tr>
                                )
                                })}
                            </TBody>
                        </Table>
                        <div className="lg:hidden">
                            {filteredMailList.map((mail, index) => {
                                const fp = getMailFp(mail)
                                const isRead = readIds.has(mail.id) || readFingerprints.has(fp)
                                const isFlagged = flaggedIds.has(mail.id)
                                return (
                                <div
                                    key={mail.id}
                                    className={classNames(
                                        'flex justify-between items-center gap-2 px-2 rounded-xl border-gray-200 dark:border-gray-700 py-4 cursor-pointer group',
                                        !isLastChild(filteredMailList, index) &&
                                            'border-b',
                                    )}
                                    onClick={(e) => handleMailClick(e, mail)}
                                >
                                    <div className="flex gap-4 min-w-0">
                                        <div className="h-[32px] w-[32px] flex items-center justify-center">
                                            <Avatar
                                                shape="circle"
                                                size="sm"
                                                icon={<TbUser />}
                                                className={classNames(
                                                    'group-hover:hidden',
                                                    mail.checked && 'hidden',
                                                )}
                                            />
                                            <div
                                                className={classNames(
                                                    'group-hover:block',
                                                    mail.checked
                                                        ? 'block'
                                                        : 'hidden',
                                                )}
                                            >
                                                <div
                                                    className="flex items-center"
                                                    onClick={(e) =>
                                                        handleCheckboxClick(
                                                            e,
                                                            mail,
                                                        )
                                                    }
                                                >
                                                    <Checkbox
                                                        checked={mail.checked}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className={`${isRead ? '!font-normal' : '!font-semibold'} heading-text truncate ${isFlagged ? 'text-red-500' : ''}`}>
                                                {mail.name}
                                            </div>
                                            <div className="min-w-0">
                                                <div className={`${isRead ? '!font-normal' : '!font-medium'} text-nowrap truncate ${isFlagged ? 'text-red-500' : ''}`}>
                                                    {mail.message && mail.message[0] ? 
                                                        mail.message[0].content.replace(htmlReg, '') :
                                                        'No content'
                                                    }
                                                </div>
                                            </div>
                                            <div className="flex items-center text-lg gap-2 mt-2">
                                                <button
                                                    type="button"
                                                    title="Flag"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        toggleEmailFlag(mail.id)
                                                    }}
                                                >
                                                    <TbFlag className={classNames(
                                                        "text-lg",
                                                        isFlagged ? "text-red-500" : "text-gray-400"
                                                    )} />
                                                </button>
                                                <button
                                                    type="button"
                                                    title="Star"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        toggleEmailStar(mail.id)
                                                    }}
                                                >
                                                    {starredIds.has(mail.id) ? (
                                                        <TbStarFilled className="text-amber-500" />
                                                    ) : (
                                                        <TbStar />
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    title="Delete"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setDeleteConfirmationOpen(
                                                            {
                                                                open: true,
                                                                selected:
                                                                    mail.id,
                                                            },
                                                        )
                                                    }}
                                                >
                                                    <TbTrash />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="">
                                        <span className={`text-nowrap font-semibold ${isFlagged ? 'text-red-500' : ''}`}>
                                            {formatEmailDate(mail.message[0].date)}
                                        </span>
                                    </div>
                                </div>
                                )})}
                        </div>
                        
                        {/* Pagination */}
                        {filteredMailList.length > 0 && (
                            <div className="flex justify-center mt-6 pb-4">
                                <Pagination
                                    displayTotal
                                    total={pagination.total}
                                    currentPage={pagination.currentPage}
                                    pageSize={pagination.pageSize}
                                    onChange={handlePaginationChange}
                                />
                            </div>
                        )}
                            </>
                        )}
                    </Loading>
                </ScrollBar>
            </div>
            <MailDeleteConfimation
                isOpen={deleteConfirmationOpen.open}
                selectedMailCount={1}
                onClose={handleClose}
                onConfirmDelete={handleConfirmDelete}
            />
        </>
    )
}

export default MailList
