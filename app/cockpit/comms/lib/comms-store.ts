'use client';

/**
 * COMMS STORE - localStorage persistence for communications
 */

import { Thread, GroupThread, DirectThread, Message } from '../types';

const KEYS = {
  THREADS: 'sx_comms_threads',
  MESSAGES: 'sx_comms_messages',
  CONTACTS: 'sx_comms_contacts',
  TEMPLATES: 'sx_comms_templates',
  AUTO_RULES: 'sx_comms_auto_rules',
  GLOBAL_UNREAD: 'sx_comms_global_unread',
};

// ============================================
// GENERIC HELPERS
// ============================================

function getStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  const raw = localStorage.getItem(key);
  if (!raw) return defaultValue;
  try {
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function setStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

// ============================================
// THREADS
// ============================================

export function getThreads(): (Thread | GroupThread | DirectThread)[] {
  return getStorage(KEYS.THREADS, []);
}

export function saveThreads(threads: (Thread | GroupThread | DirectThread)[]): void {
  setStorage(KEYS.THREADS, threads);
}

export function addThread(thread: Thread | GroupThread | DirectThread): void {
  const threads = getThreads();
  threads.push(thread);
  saveThreads(threads);
}

// ============================================
// MESSAGES
// ============================================

export function getMessages(): Message[] {
  return getStorage(KEYS.MESSAGES, []);
}

export function saveMessages(messages: Message[]): void {
  setStorage(KEYS.MESSAGES, messages);
}

export function addMessage(message: Message): void {
  const messages = getMessages();
  messages.push(message);
  saveMessages(messages);
}

export function getMessagesByThread(threadId: string): Message[] {
  return getMessages().filter(m => m.threadId === threadId);
}

// ============================================
// CONTACTS
// ============================================

export interface Contact {
  id: string;
  userId: string;
  name: string;
  username: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  isBlocked: boolean;
  isMuted: boolean;
  lastMessageAt?: number;
  addedAt: number;
}

export function getContacts(): Contact[] {
  return getStorage(KEYS.CONTACTS, []);
}

export function saveContacts(contacts: Contact[]): void {
  setStorage(KEYS.CONTACTS, contacts);
}

export function addContact(contact: Omit<Contact, 'id' | 'addedAt'>): Contact {
  const contacts = getContacts();
  const newContact: Contact = {
    ...contact,
    id: crypto.randomUUID(),
    addedAt: Date.now(),
  };
  contacts.push(newContact);
  saveContacts(contacts);
  return newContact;
}

export function toggleBlockContact(contactId: string): void {
  const contacts = getContacts();
  const idx = contacts.findIndex(c => c.id === contactId);
  if (idx >= 0) {
    contacts[idx].isBlocked = !contacts[idx].isBlocked;
    saveContacts(contacts);
  }
}

export function toggleMuteContact(contactId: string): void {
  const contacts = getContacts();
  const idx = contacts.findIndex(c => c.id === contactId);
  if (idx >= 0) {
    contacts[idx].isMuted = !contacts[idx].isMuted;
    saveContacts(contacts);
  }
}

// ============================================
// QUICK REPLY TEMPLATES
// ============================================

export interface QuickReplyTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  usageCount: number;
  createdAt: number;
}

export function getTemplates(): QuickReplyTemplate[] {
  return getStorage(KEYS.TEMPLATES, defaultTemplates());
}

export function saveTemplates(templates: QuickReplyTemplate[]): void {
  setStorage(KEYS.TEMPLATES, templates);
}

export function addTemplate(name: string, content: string, category: string): QuickReplyTemplate {
  const templates = getTemplates();
  const t: QuickReplyTemplate = {
    id: crypto.randomUUID(),
    name,
    content,
    category,
    usageCount: 0,
    createdAt: Date.now(),
  };
  templates.push(t);
  saveTemplates(templates);
  return t;
}

export function deleteTemplate(id: string): void {
  const templates = getTemplates().filter(t => t.id !== id);
  saveTemplates(templates);
}

export function incrementTemplateUsage(id: string): void {
  const templates = getTemplates();
  const idx = templates.findIndex(t => t.id === id);
  if (idx >= 0) {
    templates[idx].usageCount++;
    saveTemplates(templates);
  }
}

function defaultTemplates(): QuickReplyTemplate[] {
  return [
    { id: 'tpl-1', name: 'Thanks', content: 'Thank you for reaching out! I will get back to you shortly.', category: 'general', usageCount: 0, createdAt: Date.now() },
    { id: 'tpl-2', name: 'Collab Inquiry', content: 'Hi! I would love to discuss a potential collaboration. What did you have in mind?', category: 'business', usageCount: 0, createdAt: Date.now() },
    { id: 'tpl-3', name: 'Not Interested', content: 'Thanks for the offer, but I am not interested at this time. Best of luck!', category: 'general', usageCount: 0, createdAt: Date.now() },
    { id: 'tpl-4', name: 'Rate Card', content: 'Thanks for your interest! My current rates start at $X for [service]. Would you like more details?', category: 'business', usageCount: 0, createdAt: Date.now() },
  ];
}

// ============================================
// AUTO-RESPONSE RULES
// ============================================

export interface AutoResponseRule {
  id: string;
  name: string;
  triggerType: 'keyword' | 'new_contact' | 'time_based';
  triggerValue: string;
  responseTemplateId: string;
  isActive: boolean;
  matchCount: number;
  createdAt: number;
}

export function getAutoRules(): AutoResponseRule[] {
  return getStorage(KEYS.AUTO_RULES, []);
}

export function saveAutoRules(rules: AutoResponseRule[]): void {
  setStorage(KEYS.AUTO_RULES, rules);
}

export function addAutoRule(rule: Omit<AutoResponseRule, 'id' | 'matchCount' | 'createdAt'>): AutoResponseRule {
  const rules = getAutoRules();
  const newRule: AutoResponseRule = {
    ...rule,
    id: crypto.randomUUID(),
    matchCount: 0,
    createdAt: Date.now(),
  };
  rules.push(newRule);
  saveAutoRules(rules);
  return newRule;
}

export function toggleAutoRule(id: string): void {
  const rules = getAutoRules();
  const idx = rules.findIndex(r => r.id === id);
  if (idx >= 0) {
    rules[idx].isActive = !rules[idx].isActive;
    saveAutoRules(rules);
  }
}

export function deleteAutoRule(id: string): void {
  saveAutoRules(getAutoRules().filter(r => r.id !== id));
}

// ============================================
// GLOBAL CHAT UNREAD COUNT
// ============================================

export function getGlobalUnreadCount(): number {
  return getStorage(KEYS.GLOBAL_UNREAD, 0);
}

export function setGlobalUnreadCount(count: number): void {
  setStorage(KEYS.GLOBAL_UNREAD, count);
}

export function incrementGlobalUnread(): void {
  setGlobalUnreadCount(getGlobalUnreadCount() + 1);
}

export function clearGlobalUnread(): void {
  setGlobalUnreadCount(0);
}

// ============================================
// SEED
// ============================================

export function seedCommsIfEmpty(): void {
  if (typeof window === 'undefined') return;
  const threads = getThreads();
  if (threads.length > 0) return;

  const globalThread: Thread = {
    id: 'thread_global',
    name: 'Global',
    type: 'global',
  };

  const demoContacts: Contact[] = [
    { id: 'contact-1', userId: 'demo-founder-1', name: 'Marcus Chen', username: 'mchen', status: 'online', isBlocked: false, isMuted: false, addedAt: Date.now() },
    { id: 'contact-2', userId: 'demo-founder-2', name: 'Sarah Kim', username: 'skim', status: 'away', isBlocked: false, isMuted: false, addedAt: Date.now() },
    { id: 'contact-3', userId: 'demo-investor-1', name: 'Alex Thompson', username: 'athompson', status: 'offline', isBlocked: false, isMuted: false, addedAt: Date.now() },
  ];

  const demoMessages: Message[] = [
    { id: 'msg-seed-1', threadId: 'thread_global', authorId: 'system', authorName: 'System', content: 'Welcome to Social Exchange Global Chat. All operators are connected.', timestamp: Date.now() - 3600000 },
    { id: 'msg-seed-2', threadId: 'thread_global', authorId: 'demo-founder-1', authorName: 'Marcus Chen', content: 'Hey everyone, Urban Signal just went public. Check out the E-Shares marketplace!', timestamp: Date.now() - 1800000 },
    { id: 'msg-seed-3', threadId: 'thread_global', authorId: 'demo-investor-1', authorName: 'Alex Thompson', content: 'Just picked up some shares. Looking solid!', timestamp: Date.now() - 900000 },
  ];

  saveThreads([globalThread]);
  saveMessages(demoMessages);
  saveContacts(demoContacts);
}
