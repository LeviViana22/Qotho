import { useId } from 'react'

export default function useUniqueId(prefix = '', len = 10) {
    const id = useId()
    return `${prefix}${id}`
}
