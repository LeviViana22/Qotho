'use client'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import Tag from '@/components/ui/Tag'
import classNames from 'classnames'
import ReactHtmlParser from 'html-react-parser'
import isLastChild from '@/utils/isLastChild'
import dayjs from 'dayjs'
import {
    UPDATE_TICKET,
    COMMENT,
    ADD_TAGS_TO_TICKET,
    ADD_FILES_TO_TICKET,
    CREATE_TICKET,
    COMMENT_MENTION,
    ASSIGN_TICKET,
} from './constants'
import { ACTIVITY_TYPES, getFieldDisplayName } from '@/utils/activityUtils'
import { TbFile } from 'react-icons/tb'

const ticketStatus = {
    0: {
        label: 'Completed',
        bgClass: 'bg-emerald-500',
        textClass: 'text-emerald-500',
    },
    1: {
        label: 'In progress',
        bgClass: 'bg-blue-500',
        textClass: 'text-blue-500',
    },
    2: {
        label: 'Ready to test',
        bgClass: 'bg-amber-500',
        textClass: 'text-amber-500',
    },
}

const taskLabelColors = {
    'Live Issue': 'bg-rose-500',
    Backend: 'bg-blue-500',
    Bug: 'bg-amber-400',
    'Low priority': 'bg-indigo-500',
}

const UnixDateTime = ({ value }) => {
    return (
        <>
            {typeof value === 'string'
                ? value
                : dayjs.unix(value).format('hh:mm A')}
        </>
    )
}

const HighlightedText = ({ children, className }) => {
    return (
        <span className={classNames('font-bold heading-text', className)}>
            {children}
        </span>
    )
}

const ActivityEvent = ({ data, compact }) => {
    const options = {
        replace: (node) => {
            if (node.type === 'tag' && node?.name === 'strong') {
                return (
                    <HighlightedText key={node?.children[0]?.data}>
                        {node?.children[0]?.data}
                    </HighlightedText>
                )
            }
            return node.data
        },
    }

    switch (data.type) {
        case UPDATE_TICKET:
            return compact ? (
                <>
                    <div className="flex flex-col gap-y-0.5">
                        <HighlightedText>{data.userName}</HighlightedText>
                        <span className="text-xs font-semibold">
                            <UnixDateTime value={data.dateTime} />
                        </span>
                    </div>
                    <div className="mt-2">
                        <span className="mx-1">has change </span>
                        <HighlightedText>{data.ticket}</HighlightedText>
                        <span className="mx-1"> status to </span>
                        <span className="inline-flex items-center gap-1">
                            <Badge
                                className={
                                    ticketStatus[data.status || 0].bgClass
                                }
                            />
                            <HighlightedText className="ml-1 rtl:mr-1">
                                {ticketStatus[data.status || 0].label}
                            </HighlightedText>
                        </span>
                    </div>
                </>
            ) : (
                <p className="my-1">
                    <HighlightedText>{data.userName}</HighlightedText>
                    <span className="mx-1">has change </span>
                    <HighlightedText>{data.ticket}</HighlightedText>
                    <span className="mx-1"> status to </span>
                    <span className="inline-flex items-center gap-1">
                        <Badge
                            className={ticketStatus[data.status || 0].bgClass}
                        />
                        <HighlightedText>
                            {ticketStatus[data.status || 0].label}
                        </HighlightedText>
                    </span>
                    <span className="ml-1 rtl:mr-1 md;ml-3 md:rtl:mr-3 font-semibold">
                        <UnixDateTime value={data.dateTime} />
                    </span>
                </p>
            )
        case COMMENT:
            const getCommentActionText = (action) => {
                switch (action) {
                    case 'edited':
                        return 'editou comentário em'
                    case 'removed':
                        return 'removeu comentário de'
                    default:
                        return 'comentou em'
                }
            }
            
            return (
                <>
                    {compact ? (
                        <>
                            <div className="flex flex-col gap-y-0.5">
                                <HighlightedText>
                                    {data.userName}
                                </HighlightedText>
                                <span className="text-xs font-semibold">
                                    <UnixDateTime value={data.dateTime} />
                                </span>
                            </div>
                            <div className="mt-2">
                                <span className="mx-1">{getCommentActionText(data.action)} </span>
                                <HighlightedText>{data.ticket || 'PJ-1'}</HighlightedText>
                            </div>
                        </>
                    ) : (
                        <p className="gap-1 inline-flex items-center flex-wrap">
                            <HighlightedText>{data.userName}</HighlightedText>
                            <span className="mx-1">{getCommentActionText(data.action)} </span>
                            <HighlightedText>{data.ticket || 'PJ-1'}</HighlightedText>
                            <span className="ml-1 rtl:mr-1 md;ml-3 md:rtl:mr-3 font-semibold">
                                <UnixDateTime value={data.dateTime} />
                            </span>
                        </p>
                    )}
                    <Card
                        bordered={false}
                        className="mt-4 bg-gray-100 dark:bg-gray-700 shadow-none"
                    >
                        {ReactHtmlParser(data.comment || '', options)}
                    </Card>
                </>
            )
        case COMMENT_MENTION:
            return (
                <>
                    {compact ? (
                        <>
                            <div className="flex flex-col gap-y-0.5">
                                <HighlightedText>
                                    {data.userName}
                                </HighlightedText>
                                <span className="text-xs font-semibold">
                                    <UnixDateTime value={data.dateTime} />
                                </span>
                            </div>
                            <div className="mt-2">
                                <span className="mx-1">
                                    mentioned you in a comment
                                </span>
                                <HighlightedText>Post</HighlightedText>
                            </div>
                        </>
                    ) : (
                        <p className="my-1">
                            <HighlightedText>{data.userName}</HighlightedText>
                            <span className="mx-1">
                                mentioned you in a comment
                            </span>
                            <HighlightedText>Post</HighlightedText>
                            <span className="ml-1 rtl:mr-1 md;ml-3 md:rtl:mr-3 font-semibold">
                                <UnixDateTime value={data.dateTime} />
                            </span>
                        </p>
                    )}
                    <Card
                        bordered={false}
                        className="mt-4 bg-gray-100 dark:bg-gray-700 shadow-none"
                    >
                        {ReactHtmlParser(data.comment || '', options)}
                    </Card>
                </>
            )
        case ADD_TAGS_TO_TICKET:
            return compact ? (
                <>
                    <div className="flex flex-col gap-y-0.5">
                        <HighlightedText>{data.userName}</HighlightedText>
                        <span className="text-xs font-semibold">
                            <UnixDateTime value={data.dateTime} />
                        </span>
                    </div>
                    <div className="mt-2">
                        <span className="mx-1">added tags </span>
                        {data?.tags?.map((label, index) => (
                            <Tag
                                key={label + index}
                                prefix
                                className="mx-1"
                                prefixClass={`${taskLabelColors[label]}`}
                            >
                                {label}
                            </Tag>
                        ))}
                    </div>
                </>
            ) : (
                <div>
                    <HighlightedText>{data.userName} </HighlightedText>
                    <span className="mx-1">added tags </span>
                    <span className="inline-flex items-center gap-1">
                        {data?.tags?.map((label, index) => (
                            <Tag
                                key={label + index}
                                prefix
                                prefixClass={`${taskLabelColors[label]}`}
                            >
                                {label}
                            </Tag>
                        ))}
                    </span>
                    <span className="ml-1 rtl:mr-1 md;ml-3 md:rtl:mr-3 font-semibold">
                        <UnixDateTime value={data.dateTime} />
                    </span>
                </div>
            )
        case ADD_FILES_TO_TICKET:
            const fileAction = data.action === 'removed' ? 'removeu' : 'adicionou'
            return compact ? (
                <>
                    <div className="flex flex-col gap-y-0.5">
                        <HighlightedText>{data.userName}</HighlightedText>
                        <span className="text-xs font-semibold">
                            <UnixDateTime value={data.dateTime} />
                        </span>
                    </div>
                    <div className="mt-2">
                        <span className="mx-1">{fileAction} </span>
                        {data?.files?.map((file, index) => (
                            <span key={file + index} className="inline-flex items-center gap-1">
                                <TbFile className="text-sm" />
                                <HighlightedText>"{file}"</HighlightedText>
                                <span className="mx-1"> em </span>
                                <HighlightedText>{data.ticket}</HighlightedText>
                                {!isLastChild(data?.files || [], index) && (
                                    <span className="ltr:mr-1 rtl:ml-1">
                                        ,{' '}
                                    </span>
                                )}
                            </span>
                        ))}
                    </div>
                </>
            ) : (
                <div className="inline-flex items-center flex-wrap">
                    <HighlightedText>{data.userName} </HighlightedText>
                    <span className="mx-1">{fileAction} </span>
                    {data?.files?.map((file, index) => (
                        <span key={file + index} className="inline-flex items-center gap-1">
                            <TbFile className="text-sm" />
                            <HighlightedText>"{file}"</HighlightedText>
                            {!isLastChild(data?.files || [], index) && (
                                <span className="ltr:mr-1 rtl:ml-1">, </span>
                            )}
                        </span>
                    ))}
                    <span className="mx-1">em </span>
                    <HighlightedText>{data.ticket || 'PJ-1'} </HighlightedText>
                    <span className="ml-1 rtl:mr-1 md;ml-3 md:rtl:mr-3 font-semibold">
                        <UnixDateTime value={data.dateTime} />
                    </span>
                </div>
            )
        case ASSIGN_TICKET:
            return compact ? (
                <>
                    <div className="flex flex-col gap-y-0.5">
                        <HighlightedText>{data.userName}</HighlightedText>
                        <span className="text-xs font-semibold">
                            <UnixDateTime value={data.dateTime} />
                        </span>
                    </div>
                    <div className="mt-2">
                        <span className="mx-1">assigned ticket</span>
                        <HighlightedText>{data.ticket}</HighlightedText>
                        <span className="mx-1">to</span>
                        <HighlightedText>{data?.assignee} </HighlightedText>
                    </div>
                </>
            ) : (
                <div>
                    <HighlightedText>{data.userName} </HighlightedText>
                    <span className="mx-1">assigned ticket</span>
                    <HighlightedText>{data.ticket}</HighlightedText>
                    <span className="mx-1">to</span>
                    <HighlightedText>{data.assignee} </HighlightedText>
                    <span className="ml-1 rtl:mr-1 md;ml-3 md:rtl:mr-3 font-semibold">
                        <UnixDateTime value={data.dateTime} />
                    </span>
                </div>
            )
        case CREATE_TICKET:
            return (
                <div className="inline-flex items-center flex-wrap">
                    <HighlightedText>{data.userName} </HighlightedText>
                    <span className="mx-1">has created ticket</span>
                    <HighlightedText>{data.ticket}</HighlightedText>
                    <span className="ml-1 rtl:mr-1 md;ml-3 md:rtl:mr-3 font-semibold">
                        <UnixDateTime value={data.dateTime} />
                    </span>
                </div>
            )
        case ACTIVITY_TYPES.UPDATE_STATUS:
            return compact ? (
                <>
                    <div className="flex flex-col gap-y-0.5">
                        <HighlightedText>{data.userName}</HighlightedText>
                        <span className="text-xs font-semibold">
                            <UnixDateTime value={data.dateTime} />
                        </span>
                    </div>
                    <div className="mt-2">
                        <span className="mx-1">alterou o status de </span>
                        <HighlightedText>{data.ticket}</HighlightedText>
                        <span className="mx-1"> para </span>
                        <HighlightedText>"{data.statusLabel}"</HighlightedText>
                    </div>
                </>
            ) : (
                <p className="my-1">
                    <HighlightedText>{data.userName}</HighlightedText>
                    <span className="mx-1">alterou o status de </span>
                    <HighlightedText>{data.ticket}</HighlightedText>
                    <span className="mx-1"> para </span>
                    <HighlightedText>"{data.statusLabel}"</HighlightedText>
                    <span className="ml-1 rtl:mr-1 md;ml-3 md:rtl:mr-3 font-semibold">
                        <UnixDateTime value={data.dateTime} />
                    </span>
                </p>
            )
        case ACTIVITY_TYPES.UPDATE_FIELD:
            const fieldName = getFieldDisplayName(data.field)
            return compact ? (
                <>
                    <div className="flex flex-col gap-y-0.5">
                        <HighlightedText>{data.userName}</HighlightedText>
                        <span className="text-xs font-semibold">
                            <UnixDateTime value={data.dateTime} />
                        </span>
                    </div>
                    <div className="mt-2">
                        <span className="mx-1">atualizou </span>
                        <HighlightedText>{fieldName}</HighlightedText>
                        <span className="mx-1"> de </span>
                        <HighlightedText>{data.ticket}</HighlightedText>
                        <span className="mx-1"> de </span>
                        <HighlightedText>"{data.oldValue || 'vazio'}"</HighlightedText>
                        <span className="mx-1"> para </span>
                        <HighlightedText>"{data.newValue || 'vazio'}"</HighlightedText>
                    </div>
                </>
            ) : (
                <p className="my-1">
                    <HighlightedText>{data.userName}</HighlightedText>
                    <span className="mx-1">atualizou </span>
                    <HighlightedText>{fieldName}</HighlightedText>
                    <span className="mx-1"> de </span>
                    <HighlightedText>{data.ticket}</HighlightedText>
                    <span className="mx-1"> de </span>
                    <HighlightedText>"{data.oldValue || 'vazio'}"</HighlightedText>
                    <span className="mx-1"> para </span>
                    <HighlightedText>"{data.newValue || 'vazio'}"</HighlightedText>
                    <span className="ml-1 rtl:mr-1 md;ml-3 md:rtl:mr-3 font-semibold">
                        <UnixDateTime value={data.dateTime} />
                    </span>
                </p>
            )
        case ACTIVITY_TYPES.ADD_PENDING_ITEM:
            return compact ? (
                <>
                    <div className="flex flex-col gap-y-0.5">
                        <HighlightedText>{data.userName}</HighlightedText>
                        <span className="text-xs font-semibold">
                            <UnixDateTime value={data.dateTime} />
                        </span>
                    </div>
                    <div className="mt-2">
                        <span className="mx-1">adicionou pendência: </span>
                        <HighlightedText>"{data.pendingItem}"</HighlightedText>
                        <span className="mx-1"> em </span>
                        <HighlightedText>{data.ticket}</HighlightedText>
                    </div>
                </>
            ) : (
                <p className="my-1">
                    <HighlightedText>{data.userName}</HighlightedText>
                    <span className="mx-1">adicionou pendência: </span>
                    <HighlightedText>"{data.pendingItem}"</HighlightedText>
                    <span className="ml-1 rtl:mr-1 md;ml-3 md:rtl:mr-3 font-semibold">
                        <UnixDateTime value={data.dateTime} />
                    </span>
                </p>
            )
        case ACTIVITY_TYPES.TOGGLE_PENDING_ITEM:
            const action = data.completed ? 'concluiu' : 'desmarcou'
            return compact ? (
                <>
                    <div className="flex flex-col gap-y-0.5">
                        <HighlightedText>{data.userName}</HighlightedText>
                        <span className="text-xs font-semibold">
                            <UnixDateTime value={data.dateTime} />
                        </span>
                    </div>
                    <div className="mt-2">
                        <span className="mx-1">{action} pendência: </span>
                        <HighlightedText>"{data.pendingItem}"</HighlightedText>
                        <span className="mx-1"> em </span>
                        <HighlightedText>{data.ticket}</HighlightedText>
                    </div>
                </>
            ) : (
                <p className="my-1">
                    <HighlightedText>{data.userName}</HighlightedText>
                    <span className="mx-1">{action} pendência: </span>
                    <HighlightedText>"{data.pendingItem}"</HighlightedText>
                    <span className="ml-1 rtl:mr-1 md;ml-3 md:rtl:mr-3 font-semibold">
                        <UnixDateTime value={data.dateTime} />
                        <span className="mx-1"> em </span>
                        <HighlightedText>{data.ticket}</HighlightedText>                        
                    </span>
                </p>
            )
        case ACTIVITY_TYPES.REMOVE_PENDING_ITEM:
            return compact ? (
                <>
                    <div className="flex flex-col gap-y-0.5">
                        <HighlightedText>{data.userName}</HighlightedText>
                        <span className="text-xs font-semibold">
                            <UnixDateTime value={data.dateTime} />
                        </span>
                    </div>
                    <div className="mt-2">
                        <span className="mx-1">removeu pendência: </span>
                        <HighlightedText>"{data.pendingItem}"</HighlightedText>
                        <span className="mx-1"> em </span>
                        <HighlightedText>{data.ticket}</HighlightedText>
                    </div>
                </>
            ) : (
                <p className="my-1">
                    <HighlightedText>{data.userName}</HighlightedText>
                    <span className="mx-1">removeu pendência: </span>
                    <HighlightedText>"{data.pendingItem}"</HighlightedText>
                    <span className="ml-1 rtl:mr-1 md;ml-3 md:rtl:mr-3 font-semibold">
                        <UnixDateTime value={data.dateTime} />
                    </span>
                </p>
            )
        
        case ACTIVITY_TYPES.PROJECT_COMPLETED:
            return compact ? (
                <>
                    <div className="flex flex-col gap-y-0.5">
                        <HighlightedText>{data.userName}</HighlightedText>
                        <span className="text-xs font-semibold">
                            <UnixDateTime value={data.dateTime} />
                        </span>
                    </div>
                    <div className="mt-2">
                        <span className="mx-1">concluiu o projeto </span>
                        <HighlightedText>{data.ticket}</HighlightedText>
                    </div>
                </>
            ) : (
                <p className="my-1">
                    <HighlightedText>{data.userName}</HighlightedText>
                    <span className="mx-1">concluiu o projeto </span>
                    <HighlightedText>{data.ticket}</HighlightedText>
                    <span className="ml-1 rtl:mr-1 md;ml-3 md:rtl:mr-3 font-semibold">
                        <UnixDateTime value={data.dateTime} />
                    </span>
                </p>
            )
        
        case ACTIVITY_TYPES.PROJECT_CANCELLED:
            return compact ? (
                <>
                    <div className="flex flex-col gap-y-0.5">
                        <HighlightedText>{data.userName}</HighlightedText>
                        <span className="text-xs font-semibold">
                            <UnixDateTime value={data.dateTime} />
                        </span>
                    </div>
                    <div className="mt-2">
                        <span className="mx-1">cancelou o projeto </span>
                        <HighlightedText>{data.ticket}</HighlightedText>
                    </div>
                </>
            ) : (
                <p className="my-1">
                    <HighlightedText>{data.userName}</HighlightedText>
                    <span className="mx-1">cancelou o projeto </span>
                    <HighlightedText>{data.ticket}</HighlightedText>
                    <span className="ml-1 rtl:mr-1 md;ml-3 md:rtl:mr-3 font-semibold">
                        <UnixDateTime value={data.dateTime} />
                    </span>
                </p>
            )
        
        case ACTIVITY_TYPES.PROJECT_RESTORED:
            return compact ? (
                <>
                    <div className="flex flex-col gap-y-0.5">
                        <HighlightedText>{data.userName}</HighlightedText>
                        <span className="text-xs font-semibold">
                            <UnixDateTime value={data.dateTime} />
                        </span>
                    </div>
                    <div className="mt-2">
                        <span className="mx-1">restaurou o projeto </span>
                        <HighlightedText>{data.ticket}</HighlightedText>
                    </div>
                </>
            ) : (
                <p className="my-1">
                    <HighlightedText>{data.userName}</HighlightedText>
                    <span className="mx-1">restaurou o projeto </span>
                    <HighlightedText>{data.ticket}</HighlightedText>
                    <span className="ml-1 rtl:mr-1 md;ml-3 md:rtl:mr-3 font-semibold">
                        <UnixDateTime value={data.dateTime} />
                    </span>
                </p>
            )

        default:
            return null
    }
}

export default ActivityEvent
