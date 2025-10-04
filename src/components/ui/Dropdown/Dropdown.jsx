import { DropdownContextProvider } from './context/dropdownContext'
import DropdownMenu from './DropdownMenu'
import { CustomFloatingTree, useFloatingParentNodeId } from './CustomFloatingTree'

const Dropdown = ({ activeKey, ref, ...props }) => {
    const parentId = useFloatingParentNodeId()

    if (parentId === null) {
        return (
            <DropdownContextProvider value={{ activeKey }}>
                <CustomFloatingTree>
                    <DropdownMenu {...props} ref={ref} />
                </CustomFloatingTree>
            </DropdownContextProvider>
        )
    }

    return <DropdownMenu {...props} ref={ref} />
}

export default Dropdown
