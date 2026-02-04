'use client';

import { useState } from 'react';
import { useAccount } from '../../context/AccountContext';
import { GroupThread, GroupMember } from '../mockGroups';

interface GroupCreationPanelProps {
  onCreate: (group: GroupThread) => void;
}

export default function GroupCreationPanel({
  onCreate,
}: GroupCreationPanelProps) {
  const account = useAccount();

  const [groupName, setGroupName] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [invites, setInvites] = useState<string[]>([]);

  function addInvite() {
    if (!inviteName.trim()) return;
    setInvites(prev => [...prev, inviteName.trim()]);
    setInviteName('');
  }

  function createGroup() {
    if (!groupName.trim()) return;

    const members: GroupMember[] = [
      {
        accountId: account.id,
        name: account.name,
        status: 'owner',
      },
      ...invites.map((name, i): GroupMember => ({
        accountId: `acct-invite-${i}`,
        name,
        status: 'invited',
      })),
    ];

    onCreate({
      id: `chat-group-${crypto.randomUUID()}`,
      name: groupName,
      theme: 'default',
      members,
    });

    setGroupName('');
    setInvites([]);
  }

  return (
    <div className="group-create-panel">
      <h3>Create Group</h3>

      <input
        placeholder="Group name"
        value={groupName}
        onChange={e => setGroupName(e.target.value)}
      />

      <div className="invite-row">
        <input
          placeholder="Invite user"
          value={inviteName}
          onChange={e => setInviteName(e.target.value)}
        />
        <button onClick={addInvite}>Add</button>
      </div>

      <ul>
        {invites.map(name => (
          <li key={name}>{name} (invited)</li>
        ))}
      </ul>

      <button className="primary" onClick={createGroup}>
        Create Group
      </button>
    </div>
  );
}
