'use client'
import Dropdown from '@/components/ui/Dropdown'
import IssueField from './IssueField'
const IssueFieldDropdown = (props) => {
    const { title, titleHtml, children, icon, dropdownTrigger, width = "w-full" } = props

    return (
        <IssueField title={title} titleHtml={titleHtml} icon={icon}>
            <Dropdown
                className={`${width} h-full`}
                toggleClassName="hover:bg-gray-100 dark:hover:bg-gray-700 flex px-3 focus:bg-gray-100 cursor-pointer rounded-xl min-h-[46px]"
                placement="bottom-start"
                renderTitle={
                    <div className="inline-flex items-center gap-1">
                        {dropdownTrigger}
                    </div>
                }
            >
                {children}
            </Dropdown>
        </IssueField>
    )
}

export default IssueFieldDropdown
