import ToastWrapper from './ToastWrapper'
import { PLACEMENT } from '../utils/constants'

export const toastDefaultProps = {
    placement: PLACEMENT.TOP_END,
    offsetX: 30,
    offsetY: 30,
    transitionType: 'scale',
    block: false,
}

const defaultWrapperId = 'default'
const wrappers = new Map()

function castPlacment(placement) {
    if (/\top\b/.test(placement)) {
        return 'top-full'
    }

    if (/\bottom\b/.test(placement)) {
        return 'bottom-full'
    }
}

async function createWrapper(wrapperId, props) {
    const [wrapper] = await ToastWrapper.getInstance(props)

    wrappers.set(wrapperId || defaultWrapperId, wrapper)

    return wrapper
}

function getWrapper(wrapperId) {
    if (wrappers.size === 0) {
        return null
    }
    return wrappers.get(wrapperId || defaultWrapperId)
}

const toast = (message) => toast.push(message)

toast.push = (message, options = toastDefaultProps) => {
    console.log('Toast.push called with:', { message, options })
    
    let id = options.placement
    if (options.block) {
        id = castPlacment(options.placement)
    }

    const wrapper = getWrapper(id)
    console.log('Toast wrapper found:', wrapper)

    if (wrapper?.current) {
        console.log('Using existing wrapper')
        return wrapper.current.push(message)
    }

    console.log('Creating new wrapper')
    return createWrapper(id ?? '', options).then((ref) => {
        console.log('New wrapper created:', ref)
        return ref.current?.push(message)
    })
}

toast.remove = (key) => {
    wrappers.forEach((elm) => {
        elm.current.remove(key)
    })
}

toast.removeAll = () => {
    wrappers.forEach((elm) => elm.current.removeAll())
}

export default toast
