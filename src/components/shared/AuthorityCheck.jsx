import useAuthority from '@/utils/hooks/useAuthority'

const AuthorityCheck = (props) => {
    const { userAuthority = [], authority = [], children } = props

    // HARDCODED BYPASS - ALWAYS ALLOW ACCESS FOR LEVI VIANA
    const isLeviViana = userAuthority.includes('ADMIN') || userAuthority.includes('admin')
    
    const roleMatched = useAuthority(userAuthority, authority)

    // Always show content if it's Levi Viana (hardcoded admin)
    return <>{roleMatched || isLeviViana ? children : null}</>
}

export default AuthorityCheck
