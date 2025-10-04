'use client'
import { useEffect, useState, useRef } from 'react'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import RichTextEditor from '@/components/shared/RichTextEditor'
import { useMailStore } from '../_store/mailStore'
import { FormItem, Form } from '@/components/ui/Form'
import sleep from '@/utils/sleep'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Upload from '@/components/ui/Upload'
import { FcImageFile } from 'react-icons/fc'
import FileIcon from '@/components/view/FileIcon'
import { TbX } from 'react-icons/tb'
import NoMedia from '@/assets/svg/NoMedia'

const validationSchema = z.object({
    to: z.string().min(1, { message: 'Please enter recipient' }),
    title: z.string(),
    content: z.string().min(1, { message: 'Please enter message' }),
})

const MailEditor = () => {
    const { mail, messageDialog, toggleMessageDialog } = useMailStore()

    const [formSubmiting, setFormSubmiting] = useState(false)
    const [attachments, setAttachments] = useState([])

    const {
        handleSubmit,
        reset,
        formState: { errors },
        control,
    } = useForm({
        resolver: zodResolver(validationSchema),
    })

    // Custom attachment button component
    const AttachmentButton = () => {
        const fileInputRef = useRef(null)
        
        const handleAttachmentClick = () => {
            fileInputRef.current?.click()
        }
        
        const handleFileChange = (e) => {
            const files = Array.from(e.target.files)
            if (files.length > 0) {
                setAttachments(prev => [...prev, ...files])
            }
        }
        
        return (
            <>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx,.txt,.zip"
                    onChange={handleFileChange}
                    className="hidden"
                />
                <button
                    type="button"
                    onClick={handleAttachmentClick}
                    className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    title="Anexar arquivo"
                >
                    <FcImageFile className="w-5 h-5" />
                </button>
            </>
        )
    }

    // Custom toolbar without horizontal rule button
    const customToolBar = (editor, toolButtons) => {
        const {
            ToolButtonBold,
            ToolButtonItalic,
            ToolButtonStrike,
            ToolButtonCode,
            ToolButtonBlockquote,
            ToolButtonHeading,
            ToolButtonBulletList,
            ToolButtonOrderedList,
            ToolButtonCodeBlock,
            ToolButtonParagraph,
            ToolButtonUndo,
            ToolButtonRedo,
        } = toolButtons

        return (
            <>
                <ToolButtonBold editor={editor} />
                <ToolButtonItalic editor={editor} />
                <ToolButtonStrike editor={editor} />
                <ToolButtonCode editor={editor} />
                <ToolButtonBlockquote editor={editor} />
                <ToolButtonHeading editor={editor} />
                <ToolButtonBulletList editor={editor} />
                <ToolButtonOrderedList editor={editor} />
                <ToolButtonCodeBlock editor={editor} />
                <ToolButtonParagraph editor={editor} />
                <ToolButtonUndo editor={editor} />
                <ToolButtonRedo editor={editor} />
                <AttachmentButton />
            </>
        )
    }

    useEffect(() => {
        if (messageDialog.mode === 'reply') {
            reset({
                to: mail.from,
                title: `Re:${mail.title}`,
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messageDialog.mode])

    const handleDialogClose = () => {
        toggleMessageDialog({
            mode: '',
            open: false,
        })
        reset({
            to: '',
            title: '',
            content: '',
        })
        setAttachments([])
    }

    const onSubmit = async (value) => {
        console.log('values', value)
        setFormSubmiting(true)
        
        try {
            console.log('Sending email to API...')
            const response = await fetch('/api/email/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: value.to,
                    subject: value.title,
                    content: value.content,
                    attachments: attachments,
                }),
            })

            console.log('API response status:', response.status)
            const result = await response.json()
            console.log('API response result:', result)

            if (response.ok && result.success) {
                toast.push(<Notification type="success">Email enviado com sucesso!</Notification>, {
                    placement: 'top-center',
                })
                handleDialogClose()
            } else {
                console.error('Email send failed:', result)
                toast.push(
                    <Notification type="danger">
                        Erro ao enviar email: {result.error || result.details || 'Unknown error'}
                    </Notification>,
                    {
                        placement: 'top-center',
                    }
                )
            }
        } catch (error) {
            console.error('Email send error:', error)
            toast.push(
                <Notification type="danger">
                    Erro ao enviar email: {error.message}
                </Notification>,
                {
                    placement: 'top-center',
                }
            )
        } finally {
            setFormSubmiting(false)
        }
    }

    return (
        <Dialog
            isOpen={messageDialog.open}
            onClose={handleDialogClose}
            onRequestClose={handleDialogClose}
            width={1040}
            height="80vh"
            contentClassName="dialog-content-large"
        >
            <h4 className="mb-4">
                {messageDialog.mode === 'new' && 'Novo Email'}
                {messageDialog.mode === 'reply' && 'Responder'}
            </h4>
            <Form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-1">
                    <FormItem
                        label="Título:"
                        invalid={Boolean(errors.title)}
                        errorMessage={errors.title?.message}
                    >
                        <Controller
                            name="title"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    autoComplete="off"
                                    placeholder="Adicione um assunto"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem
                        label="Destinatário:"
                        invalid={Boolean(errors.to)}
                        errorMessage={errors.to?.message}
                    >
                        <Controller
                            name="to"
                            control={control}
                            render={({ field }) => (
                                <Input autoComplete="off" 
                                placeholder="Adicione um destinatário"
                                {...field} />
                            )}
                        />
                    </FormItem>
                </div>
                <FormItem
                    label="Mensagem:"
                    invalid={Boolean(errors.content)}
                    errorMessage={errors.content?.message}
                >
                    <Controller
                        name="content"
                        control={control}
                        render={({ field }) => (
                            <div 
                                className="min-h-[250px] cursor-text"
                                onClick={(e) => {
                                    // Find the editor content area and focus it
                                    const editorContent = e.currentTarget.querySelector('.ProseMirror')
                                    if (editorContent) {
                                        editorContent.focus()
                                    }
                                }}
                            >
                                <RichTextEditor
                                    content={field.value}
                                    invalid={Boolean(errors.content)}
                                    customToolBar={customToolBar}
                                    editorContentClass="min-h-[200px] max-h-[200px] overflow-y-auto"
                                    onChange={({ html }) => {
                                        field.onChange(html)
                                    }}
                                />
                            </div>
                        )}
                    />
                </FormItem>
                
                {/* Attachment Display - Always visible with fixed height */}
                <div className="mt-4">
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Anexos {attachments.length > 0 && `(${attachments.length})`}
                    </div>
                    <div className="h-32 flex items-center justify-center">
                        {attachments.length > 0 ? (
                            <div className="w-full max-h-32 overflow-y-auto">
                                <div className="inline-flex flex-wrap gap-2">
                                    {attachments.map((file, index) => (
                                        <div 
                                            key={`${file.name}-${index}`} 
                                            className="min-w-[200px] h-12 rounded-lg dark:bg-gray-800 border border-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 dark:border-gray-700 px-3 inline-flex items-center gap-2 transition-all relative"
                                        >
                                            <FileIcon type={file.type?.split('/')[1] || 'doc'} size={24} />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-gray-900 dark:text-gray-100 truncate text-xs" title={file.name}>
                                                    {file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name}
                                                </div>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {Math.round(file.size / 1000)} kb
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                                                className="p-1 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                                                title="Remover"
                                            >
                                                <TbX className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2 items-center justify-center">
                                <NoMedia height={60} width={60} />
                                <p className="font-semibold text-gray-500 dark:text-gray-400 text-sm">Sem anexos</p>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="text-right mt-6">
                    <Button
                        className="ltr:mr-2 rtl:ml-2"
                        variant="plain"
                        type="button"
                        onClick={handleDialogClose}
                    >
                        Fechar
                    </Button>
                    <Button
                        variant="solid"
                        loading={formSubmiting}
                        type="submit"
                    >
                        Enviar
                    </Button>
                </div>
            </Form>
        </Dialog>
    )
}

export default MailEditor
