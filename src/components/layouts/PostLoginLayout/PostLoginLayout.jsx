'use client'
import { useEffect } from 'react'
import {
    LAYOUT_COLLAPSIBLE_SIDE,
    LAYOUT_STACKED_SIDE,
    LAYOUT_TOP_BAR_CLASSIC,
    LAYOUT_FRAMELESS_SIDE,
    LAYOUT_CONTENT_OVERLAY,
    LAYOUT_BLANK,
} from '@/constants/theme.constant'
import FrameLessSide from './components/FrameLessSide'
import CollapsibleSide from './components/CollapsibleSide'
import StackedSide from './components/StackedSide'
import TopBarClassic from './components/TopBarClassic'
import ContentOverlay from './components/ContentOverlay'
import Blank from './components/Blank'
import PageContainer from '@/components/template/PageContainer'
import queryRoute from '@/utils/queryRoute'
import useTheme from '@/utils/hooks/useTheme'
import { usePathname } from 'next/navigation'

const Layout = ({ children, layoutType }) => {
    switch (layoutType) {
        case LAYOUT_COLLAPSIBLE_SIDE:
            return <CollapsibleSide>{children}</CollapsibleSide>
        case LAYOUT_STACKED_SIDE:
            return <StackedSide>{children}</StackedSide>
        case LAYOUT_TOP_BAR_CLASSIC:
            return <TopBarClassic>{children}</TopBarClassic>
        case LAYOUT_FRAMELESS_SIDE:
            return <FrameLessSide>{children}</FrameLessSide>
        case LAYOUT_CONTENT_OVERLAY:
            return <ContentOverlay>{children}</ContentOverlay>
        case LAYOUT_BLANK:
            return <Blank>{children}</Blank>
        default:
            return <>{children}</>
    }
}

const PostLoginLayout = ({ children }) => {
    const layoutType = useTheme((state) => state.layout.type)

    const pathname = usePathname()

    const route = queryRoute(pathname)

    // Global event listener for scrumboardDataChanged events
    useEffect(() => {
        console.log('PostLoginLayout: Setting up global event listener for scrumboardDataChanged');
        
        const handleScrumboardDataChange = () => {
            console.log('PostLoginLayout: scrumboardDataChanged event received');
            try {
                const storedData = localStorage.getItem('scrumboardData');
                if (storedData) {
                    const newData = JSON.parse(storedData);
                    console.log('PostLoginLayout: Retrieved data from localStorage:', newData);
                    
                    // Dispatch ticketDataChanged event for TicketContent components
                    window.dispatchEvent(new CustomEvent('ticketDataChanged', { 
                        detail: { newData } 
                    }));
                    console.log('PostLoginLayout: ticketDataChanged event dispatched');
                } else {
                    console.log('PostLoginLayout: No stored data found in localStorage');
                }
            } catch (error) {
                console.error('Error handling scrumboardDataChanged event:', error);
            }
        };

        window.addEventListener('scrumboardDataChanged', handleScrumboardDataChange);
        console.log('PostLoginLayout: Event listener added for scrumboardDataChanged');
        
        return () => {
            window.removeEventListener('scrumboardDataChanged', handleScrumboardDataChange);
            console.log('PostLoginLayout: Event listener removed for scrumboardDataChanged');
        };
    }, []);

    return (
        <Layout
            layoutType={route?.meta?.layout ? route?.meta?.layout : layoutType}
        >
            <PageContainer {...route?.meta}>{children}</PageContainer>
        </Layout>
    )
}

export default PostLoginLayout
