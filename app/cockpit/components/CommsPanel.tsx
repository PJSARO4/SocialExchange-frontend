'use client';

import { useRouter } from 'next/navigation';

interface Props {
  messages: Array<{
    id: number;
    from: string;
    preview: string;
    unread: boolean;
  }>;
}

export default function CommsPanel({ messages }: Props) {
  const router = useRouter();

  return (
    <div className="panel panel-comms">
      <div className="panel-header">
        <h2 className="panel-title">Comms</h2>
      </div>
      <div className="panel-body">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`comms-message ${msg.unread ? 'unread' : ''}`}
          >
            <div className="comms-message-from">{msg.from}</div>
            <div className="comms-message-preview">{msg.preview}</div>
          </div>
        ))}
      </div>
      <button
        onClick={() => router.push('/cockpit/comms')}
        className="panel-action-button"
      >
        View All Messages
      </button>
    </div>
  );
}
