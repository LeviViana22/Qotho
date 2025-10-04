'use client'
import ConfirmDialog from '@/components/shared/ConfirmDialog'

const MailDeleteConfimation = ({
    isOpen,
    onClose,
    onConfirmDelete,
    selectedMailCount,
}) => {
    return (
        <ConfirmDialog
            isOpen={isOpen}
            type="danger"
            title="Deletar Email"
            onClose={onClose}
            onRequestClose={onClose}
            onCancel={onClose}
            onConfirm={onConfirmDelete}
        >
            <p>
                Tem certeza que deseja deletar{' '}
                {selectedMailCount > 1
                    ? `${selectedMailCount} emails`
                    : 'esse email'}{' '}
                ? Esta ação não pode ser desfeita.{' '}
            </p>
        </ConfirmDialog>
    )
}

export default MailDeleteConfimation
