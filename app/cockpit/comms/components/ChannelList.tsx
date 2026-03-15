'use client';

import { useState } from 'react';
import { MessageSquare, Bell, BellOff, Ban } from 'lucide-react';
import { useComms } from '../context/CommsContext';
import { GroupThread, DirectThread } from '../types';
import { toggleBlockContact, toggleMuteContact } from '../lib/comms-store';

export default function ChannelList() {
  const {
    threads, activeThreadId, setActiveThreadId,
    createGroupThread, createDirectThread,
    unreadMap, contacts,
  } = useComms();

  const [showGroupForm, setShowGroupForm] = useState(false);
  const [showDirectForm, setShowDirectForm] = useState(false);
  const [showContacts, setShowContacts] = useState(false);

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
    const invitedUsers = groupInvites.split(',').map(u => u?.trim()).filter(Boolean);
    createGroupThread(groupName.trim(), groupTheme, invitedUsers);
    setGroupName(''); setGroupTheme('general'); setGroupInvites(''); setShowGroupForm(false);
  };

  const handleCreateDirect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dmUsername?.trim()) return;
    createDirectThread(dmUsername.trim(), dmInitialMessage?.trim());
    setDmUsername(''); setDmInitialMessage(''); setShowDirectForm(false);
  };

  const statusColor = (status: string) => {
    if (status === 'online') return 'var(--comms-status-online)';
    if (status === 'away') return '#f59e0b';
    return 'var(--comms-text-ghost)';
  };

  return (
    <div className="comms-channel-list">
      {/* Tab toggle: Channels vs Contacts */}
      <div className="comms-list-tabs">
        <button
          className={`comms-list-tab ${!showContacts ? 'active' : ''}`}
          onClick={() => setShowContacts(false)}
        >
          CHANNELS
        </button>
        <button
          className={`comms-list-tab ${showContacts ? 'active' : ''}`}
          onClick={() => setShowContacts(true)}
        >
          CONTACTS
        </button>
      </div>

      {showContacts ? (
        /* ===================== CONTACTS PANEL ===================== */
        <div className="comms-contacts-panel">
          <div className="comms-contacts-header">
            <span className="comms-contacts-count">{contacts.length} contacts</span>
          </div>
          {contacts.length === 0 ? (
            <div className="comms-contacts-empty">No contacts yet</div>
          ) : (
            <div className="comms-contacts-list">
              {contacts.map(contact => (
                <div key={contact.id} className={`comms-contact-item ${contact.isBlocked ? 'blocked' : ''}`}>
                  <div className="comms-contact-avatar">
                    <span className="comms-contact-initial">{contact.name.charAt(0)}</span>
                    <span className="comms-contact-status-dot" style={{ background: statusColor(contact.status) }} />
                  </div>
                  <div className="comms-contact-info">
                    <div className="comms-contact-name">{contact.name}</div>
                    <div className="comms-contact-username">@{contact.username} · {contact.status}</div>
                  </div>
                  <div className="comms-contact-actions">
                    <button
                      className="comms-contact-action-btn"
                      title="Send DM"
                      onClick={() => { createDirectThread(contact.name); setShowContacts(false); }}
                    >
                      <MessageSquare size={14} />
                    </button>
                    <button
                      className={`comms-contact-action-btn ${contact.isMuted ? 'active' : ''}`}
                      title={contact.isMuted ? 'Unmute' : 'Mute'}
                      onClick={() => toggleMuteContact(contact.id)}
                    >
                      {contact.isMuted ? <BellOff size={14} /> : <Bell size={14} />}
                    </button>
                    <button
                      className={`comms-contact-action-btn ${contact.isBlocked ? 'active' : ''}`}
                      title={contact.isBlocked ? 'Unblock' : 'Block'}
                      onClick={() => toggleBlockContact(contact.id)}
                    >
                      <Ban size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ===================== CHANNELS PANEL ===================== */
        <>
          {/* Global */}
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
                {(unreadMap[globalThread.id] || 0) > 0 && (
                  <div className="comms-unread-badge">{unreadMap[globalThread.id]}</div>
                )}
              </div>
            )}
          </div>

          {/* Groups */}
          <div className="comms-channel-section">
            <div className="comms-channel-section-header">
              <h3 className="comms-channel-section-title">GROUPS</h3>
              <button className="comms-add-button" onClick={() => setShowGroupForm(!showGroupForm)} type="button">
                {showGroupForm ? '−' : '+'}
              </button>
            </div>

            {showGroupForm && (
              <form className="comms-inline-form" onSubmit={handleCreateGroup}>
                <div className="comms-form-field">
                  <label className="comms-form-label">Group Name</label>
                  <input type="text" className="comms-form-input" value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Engineering Team" required />
                </div>
                <div className="comms-form-field">
                  <label className="comms-form-label">Theme</label>
                  <select className="comms-form-select" value={groupTheme} onChange={e => setGroupTheme(e.target.value)}>
                    <option value="general">General</option>
                    <option value="engineering">Engineering</option>
                    <option value="operations">Operations</option>
                    <option value="tactical">Tactical</option>
                  </select>
                </div>
                <div className="comms-form-field">
                  <label className="comms-form-label">Invite Users</label>
                  <input type="text" className="comms-form-input" value={groupInvites} onChange={e => setGroupInvites(e.target.value)} placeholder="alice, bob, charlie" />
                </div>
                <div className="comms-form-actions">
                  <button type="submit" className="comms-form-submit">CREATE</button>
                  <button type="button" className="comms-form-cancel" onClick={() => setShowGroupForm(false)}>CANCEL</button>
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
                  {(unreadMap[group?.id] || 0) > 0 && (
                    <div className="comms-unread-badge">{unreadMap[group.id]}</div>
                  )}
                  <div className="comms-channel-count">{group?.members?.length || 0}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Direct Messages */}
          <div className="comms-channel-section">
            <div className="comms-channel-section-header">
              <h3 className="comms-channel-section-title">DIRECT</h3>
              <button className="comms-add-button" onClick={() => setShowDirectForm(!showDirectForm)} type="button">
                {showDirectForm ? '−' : '+'}
              </button>
            </div>

            {showDirectForm && (
              <form className="comms-inline-form" onSubmit={handleCreateDirect}>
                <div className="comms-form-field">
                  <label className="comms-form-label">Username</label>
                  <input type="text" className="comms-form-input" value={dmUsername} onChange={e => setDmUsername(e.target.value)} placeholder="username" required />
                </div>
                <div className="comms-form-field">
                  <label className="comms-form-label">Initial Message</label>
                  <input type="text" className="comms-form-input" value={dmInitialMessage} onChange={e => setDmInitialMessage(e.target.value)} placeholder="Hey, checking in..." />
                </div>
                <div className="comms-form-actions">
                  <button type="submit" className="comms-form-submit">START DM</button>
                  <button type="button" className="comms-form-cancel" onClick={() => setShowDirectForm(false)}>CANCEL</button>
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
                  {(unreadMap[dm?.id] || 0) > 0 && (
                    <div className="comms-unread-badge">{unreadMap[dm.id]}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
