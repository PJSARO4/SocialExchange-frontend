'use client';

import { useAccount } from '../../context/AccountContext';
import { useComms } from '../context/CommsContext';

const USERS = [
  { accountId: 'acct-002', name: 'Alex Chen' },
  { accountId: 'acct-003', name: 'Morgan Lee' },
];

export default function DirectCreationPanel({ onClose }: { onClose: () => void }) {
  const account = useAccount();
  const { createDirectThread } = useComms();

  return (
    <div className="overlay-panel">
      <h3>Start Direct Message</h3>

      {USERS.map(u => (
        <button
          key={u.accountId}
          onClick={() => {
            createDirectThread(u.name);
            onClose();
          }}
        >
          {u.name}
        </button>
      ))}

      <button className="secondary" onClick={onClose}>
        Cancel
      </button>
    </div>
  );
}
