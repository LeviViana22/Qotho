'use client'
import { truncateFileName, truncateFolderName } from '@/utils/textTruncate'

const TextTruncationDemo = () => {
    const longFileName = "ThisIsAVeryLongFileNameThatShouldBeTruncatedWithEllipsis.pdf"
    const longFolderName = "ThisIsAVeryLongFolderNameThatShouldBeTruncated"
    const shortFileName = "ShortName.pdf"
    const shortFolderName = "ShortFolder"

    return (
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Text Truncation Demo</h3>
            
            <div className="space-y-4">
                <div>
                    <h4 className="font-medium">File Names:</h4>
                    <p><strong>Original:</strong> {longFileName}</p>
                    <p><strong>Truncated:</strong> {truncateFileName(longFileName)}</p>
                    <p><strong>Short (no change):</strong> {truncateFileName(shortFileName)}</p>
                </div>
                
                <div>
                    <h4 className="font-medium">Folder Names:</h4>
                    <p><strong>Original:</strong> {longFolderName}</p>
                    <p><strong>Truncated:</strong> {truncateFolderName(longFolderName)}</p>
                    <p><strong>Short (no change):</strong> {truncateFolderName(shortFolderName)}</p>
                </div>
            </div>
        </div>
    )
}

export default TextTruncationDemo
