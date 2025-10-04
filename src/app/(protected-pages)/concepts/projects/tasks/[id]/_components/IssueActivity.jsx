'use client'

import { useIssueStore } from '../_store/issueStore'
import Timeline from '@/components/ui/Timeline'
import { ActivityAvatar, ActivityEvent } from '@/components/view/Activity'
import isEmpty from 'lodash/isEmpty'

const IssueActivity = () => {
    const { issueData } = useIssueStore()

    return (
        <div className="lg:px-6 h-full flex flex-col">
            <h5 className="mb-4 flex-shrink-0">Activity</h5>
            <div className="flex-1 overflow-y-auto min-h-0 scrollbar-none hover:scrollbar-thin hover:scrollbar-thumb-gray-400 hover:scrollbar-track-transparent">
                <Timeline>
                    {isEmpty(issueData.activity) ? (
                        <Timeline.Item>No Activities</Timeline.Item>
                    ) : (
                        issueData.activity.map((event, index) => (
                            <Timeline.Item
                                key={event.type + index}
                                media={<ActivityAvatar data={event} />}
                            >
                                <div className="mt-1">
                                    <ActivityEvent compact data={event} />
                                </div>
                            </Timeline.Item>
                        ))
                    )}
                </Timeline>
            </div>
        </div>
    )
}

export default IssueActivity
