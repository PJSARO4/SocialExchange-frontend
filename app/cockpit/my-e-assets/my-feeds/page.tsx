'use client';

import { FeedsProvider } from './context/FeedsContext';
import MyFeedsContent from './MyFeedsContent';

import './my-feeds.css';

export default function MyFeedsPage() {
  return (
    <FeedsProvider>
      <MyFeedsContent />
    </FeedsProvider>
  );
}
