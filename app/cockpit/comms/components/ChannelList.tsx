'use client';

import { useState } from 'react';
import { useComms } from '../context/CommsContext';
import { GroupThread, DirectThread } from '../types';

export default function ChannelList() {
  const { threads, activeThreadId, setActiveThreadId, createGroupThread, createDirectThread } = useComms();
  
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [showDirectForm, setShowDirectForm] = useState(false);
  
  const [groupName, setGroupName] = useState('');
  const [groupTheme, setGroupTheme] = useState('general');
  const [groupInvites, setGroupInvites] = useState('');
  
  const [dmUsername, setDmUsername] = useState('');
  const [dmInitialMessage, setDmInitialMessage] = useState('');

  const globalThread = threads?.find(t => t?.type === 'global') || null;
  const groupThreads = (threads?.filter(t => t?.type === 'group') || []) as GroupThread[];
  const directThreads = (threads?.filter(t => t?.type === 'direct') || []) as DirectThread[];

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName?.trim()) return;

    const invitedUsers = groupInvites
      .split(',')
      .map(u => u?.trim())
      .filter(Boolean);

    createGroupThread(groupName.trim(), groupTheme, invitedUsers);
    
    setGroupName('');
    setGroupTheme('general');
    setGroupInvites('');
    setShowGroupForm(false);
  };

  const handleCreateDirect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dmUsername?.trim()) return;

    createDirectThread(dmUsername.trim(), dmInitialMessage?.trim());
    
    setDmUsername('');
    setDmInitialMessage('');
    setShowDirectForm(false);
  };

  return (
    <div className="comms-channel-list">
      <div className="comms-channel-section">
        <div className="comms-channel-section-header">
          <h3 className="comms-channel-section-title">GLOBAL</h3>
        </div>
        {globalThread && (
          <div
            className={`comms-channel-item ${activeThreadId === globalThread.id ? 'active' : ''}`}
            onClick={() => setActiveThreadId(globalThread.id)}
          >
            <div className="comms-channel-icon">●</div>
            <div className="comms-channel-name">{globalThread.name}</div>
          </div>
        )}
      </div>

      <div className="comms-channel-section">
        <div className="comms-channel-section-header">
          <h3 className="comms-channel-section-title">GROUPS</h3>
          <button
            className="comms-add-button"
            onClick={() => setShowGroupForm(!showGroupForm)}
            type="button"
          >
            {showGroupForm ? '−' : '+'}
          </button>
        </div>

        {showGroupForm && (
          <form className="comms-inline-form" onSubmit={handleCreateGroup}>
            <div className="comms-form-field">
              <label className="comms-form-label">Group Name</label>
              <input
                type="text"
                className="comms-form-input"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Engineering Team"
                required
              />
            </div>
            <div className="comms-form-field">
              <label className="comms-form-label">Theme</label>
              <select
                className="comms-form-select"
                value={groupTheme}
                onChange={(e) => setGroupTheme(e.target.value)}
              >
                <option value="general">General</option>
                <option value="engineering">Engineering</option>
                <option value="operations">Operations</option>
                <option value="tactical">Tactical</option>
              </select>
            </div>
            <div className="comms-form-field">
              <label className="comms-form-label">Invite Users</label>
              <input
                type="text"
                className="comms-form-input"
                value={groupInvites}
                onChange={(e) => setGroupInvites(e.target.value)}
                placeholder="alice, bob, charlie"
              />
            </div>
            <div className="comms-form-actions">
              <button type="submit" className="comms-form-submit">CREATE</button>
              <button
                type="button"
                className="comms-form-cancel"
                onClick={() => setShowGroupForm(false)}
              >
                CANCEL
              </button>
            </div>
          </form>
        )}

        <div className="comms-channel-list-items">
          {groupThreads.map(group => (
            <div
              key={group?.id || Math.random()}
              className={`comms-channel-item ${activeThreadId === group?.id ? 'active' : ''}`}
              onClick={() => setActiveThreadId(group?.id)}
            >
              <div className="comms-channel-icon">#</div>
              <div className="comms-channel-name">{group?.name || 'Unnamed'}</div>
              <div className="comms-channel-count">{group?.members?.length || 0}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="comms-channel-section">
        <div className="comms-channel-section-header">
          <h3 className="comms-channel-section-title">DIRECT</h3>
          <button
            className="comms-add-button"
            onClick={() => setShowDirectForm(!showDirectForm)}
            type="button"
          >
            {showDirectForm ? '−' : '+'}
          </button>
        </div>

        {showDirectForm && (
          <form className="comms-inline-form" onSubmit={handleCreateDirect}>
            <div className="comms-form-field">
              <label className="comms-form-label">Username</label>
              <input
                type="text"
                className="comms-form-input"
                value={dmUsername}
                onChange={(e) => setDmUsername(e.target.value)}
                placeholder="username"
                required
              />
            </div>
            <div className="comms-form-field">
              <label className="comms-form-label">Initial Message</label>
              <input
                type="text"
                className="comms-form-input"
                value={dmInitialMessage}
                onChange={(e) => setDmInitialMessage(e.target.value)}
                placeholder="Hey, checking in..."
              />
            </div>
            <div className="comms-form-actions">
              <button type="submit" className="comms-form-submit">START DM</button>
              <button
                type="button"
                className="comms-form-cancel"
                onClick={() => setShowDirectForm(false)}
              >
                CANCEL
              </button>
            </div>
          </form>
        )}

        <div className="comms-channel-list-items">
          {directThreads.map(dm => (
            <div
              key={dm?.id || Math.random()}
              className={`comms-channel-item ${activeThreadId === dm?.id ? 'active' : ''}`}
              onClick={() => setActiveThreadId(dm?.id)}
            >
              <div className="comms-channel-icon">@</div>
              <div className="comms-channel-name">{dm?.name || 'Unknown'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}