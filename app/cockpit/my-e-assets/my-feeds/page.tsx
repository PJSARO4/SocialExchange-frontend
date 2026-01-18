'use client';

import { useRouter } from 'next/navigation';

export default function MyFeedsPage() {
  const router = useRouter();

  return (
    <div className="my-feeds-page">
      <h1>My Feeds</h1>

      <button onClick={() => router.push('/cockpit/my-e-assets/my-feeds/ownership')}>
        Manage Feeds
      </button>

      <button onClick={() => router.push('/cockpit/my-e-assets/my-feeds/scheduler')}>
        Scheduler
      </button>

      <button onClick={() => router.push('/cockpit/my-e-assets/my-feeds/automation')}>
        Automation
      </button>
    </div>
  );
}
