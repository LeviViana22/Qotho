import { useMemo } from 'react'
import Tooltip from '@/components/ui/Tooltip'
import Avatar from '@/components/ui/Avatar'
import acronym from '@/utils/acronym'
import useRandomBgColor from '@/utils/hooks/useRandomBgColor'

const UsersAvatarGroup = (props) => {
    const {
        avatarGroupProps = {},
        avatarProps = {},
        imgKey = 'img',
        nameKey = 'name',
        onAvatarClick,
        users = [],
        ...rest
    } = props

    const bgColor = useRandomBgColor()

    const defaultAvatarProps = useMemo(() => {
        return {
            shape: 'circle',
            size: 30,
            className: 'cursor-pointer',
            ...avatarProps,
        }
    }, [avatarProps])

    const handleAvatarClick = (avatar) => {
        onAvatarClick?.(avatar)
    }

    return (
        <Avatar.Group
            omittedAvatarTooltip
            chained
            omittedAvatarProps={defaultAvatarProps}
            omittedAvatarTooltipProps={{
                wrapperClass: 'flex',
            }}
            {...avatarGroupProps}
            {...rest}
        >
            {(users || []).map((elm, index) => {
                // Safety check for null/undefined user objects
                if (!elm) return null
                
                const userName = elm[nameKey] || 'Unknown'
                const userImg = elm[imgKey] || ''
                
                return (
                    <Tooltip
                        key={userName + index}
                        wrapperClass="flex"
                        title={userName}
                    >
                        <Avatar
                            {...defaultAvatarProps}
                            className={`${
                                userImg ? '' : bgColor(userName)
                            } ${defaultAvatarProps.className}`}
                            src={userImg}
                            onClick={() => handleAvatarClick(elm)}
                        >
                            {acronym(userName)}
                        </Avatar>
                    </Tooltip>
                )
            })}
        </Avatar.Group>
    )
}

export default UsersAvatarGroup
