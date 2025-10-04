'use client'
const IssueField = (props) => {
    const { title, icon, children, titleHtml } = props

    return (
        <div className="flex items-center mb-2">
            <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100 min-w-[150px]">
                <span className="text-lg">{icon}</span>
                {titleHtml ? (
                    <span dangerouslySetInnerHTML={{ __html: titleHtml }} />
                ) : (
                    <span>{title}</span>
                )}
            </div>
            {children}
        </div>
    )
}

export default IssueField
