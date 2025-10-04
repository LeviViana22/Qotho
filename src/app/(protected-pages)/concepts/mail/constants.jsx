import {
    HiOutlineInbox,
    HiOutlinePaperAirplane,
    HiOutlinePencil,
    HiOutlineStar,
    HiOutlineTrash,
    HiOutlineExclamation,
    HiOutlineArchive,
} from 'react-icons/hi'

export const groupList = [
    { value: 'inbox', label: 'Caixa de entrada', icon: <HiOutlineInbox /> },
    { value: 'sentItem', label: 'Enviados', icon: <HiOutlinePaperAirplane /> },
    { value: 'draft', label: 'Rascunhos', icon: <HiOutlinePencil /> },
    { value: 'starred', label: 'Favoritos', icon: <HiOutlineStar /> },
    { value: 'junk', label: 'Spam', icon: <HiOutlineExclamation /> },
    { value: 'archive', label: 'Arquivo', icon: <HiOutlineArchive /> },
    { value: 'deleted', label: 'Lixeira', icon: <HiOutlineTrash /> },
]

