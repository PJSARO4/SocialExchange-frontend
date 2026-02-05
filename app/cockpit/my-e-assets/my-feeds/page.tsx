'use client';

import { FeedsProvider } from './context/FeedsContext';
import { WorkflowEventsProvider } from './context/WorkflowEventsContext';
import MyFeedsContent from './MyFeedsContent';

import './my-feeds.css';

export default function MyFeedsPage() {
  return (
    <FeedsProvider>
      <WorkflowEventsProvider>
        <MyFeedsContent />
      </WorkflowEventsProvider>
    </FeedsProvider>
  );
}
