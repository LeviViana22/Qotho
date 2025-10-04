import DropdownMenu from './DropdownMenu'
import { CustomFloatingTree, useFloatingParentNodeId } from './CustomFloatingTree'

const DropdownSub = ({ ref, ...props }) => {
    const parentId = useFloatingParentNodeId()

    if (parentId === null) {
        return (
            <CustomFloatingTree>
                <DropdownMenu {...props} ref={ref} />
            </CustomFloatingTree>
        )
    }

    return <DropdownMenu {...props} ref={ref} />
}

export default DropdownSub
