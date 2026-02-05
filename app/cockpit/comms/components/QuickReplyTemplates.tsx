'use client';

import { useState, useEffect } from 'react';
import { getTemplates, addTemplate, deleteTemplate, incrementTemplateUsage, QuickReplyTemplate } from '../lib/comms-store';
import './comms-enhanced.css';

interface Props {
  onSelectTemplate: (content: string) => void;
}

export default function QuickReplyTemplates({ onSelectTemplate }: Props) {
  const [templates, setTemplates] = useState<QuickReplyTemplate[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    setTemplates(getTemplates());
  }, []);

  const handleUse = (tpl: QuickReplyTemplate) => {
    incrementTemplateUsage(tpl.id);
    onSelectTemplate(tpl.content);
    setTemplates(getTemplates());
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newContent.trim()) return;
    addTemplate(newName.trim(), newContent.trim(), newCategory);
    setTemplates(getTemplates());
    setNewName('');
    setNewContent('');
    setShowCreate(false);
  };

  const handleDelete = (id: string) => {
    deleteTemplate(id);
    setTemplates(getTemplates());
  };

  const categories = ['all', ...new Set(templates.map(t => t.category))];
  const filtered = filter === 'all' ? templates : templates.filter(t => t.category === filter);

  return (
    <div className="quick-reply-panel">
      <div className="qr-header">
        <h3 className="qr-title">QUICK REPLIES</h3>
        <button className="qr-add-btn" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'CANCEL' : '+ NEW'}
        </button>
      </div>

      {showCreate && (
        <form className="qr-create-form" onSubmit={handleCreate}>
          <input
            className="qr-input"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Template name..."
            required
          />
          <textarea
            className="qr-textarea"
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            placeholder="Template content..."
            required
            rows={3}
          />
          <select className="qr-select" value={newCategory} onChange={e => setNewCategory(e.target.value)}>
            <option value="general">General</option>
            <option value="business">Business</option>
            <option value="support">Support</option>
            <option value="marketing">Marketing</option>
          </select>
          <button type="submit" className="qr-submit">CREATE</button>
        </form>
      )}

      <div className="qr-filters">
        {categories.map(cat => (
          <button
            key={cat}
            className={`qr-filter-btn ${filter === cat ? 'active' : ''}`}
            onClick={() => setFilter(cat)}
          >
            {cat.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="qr-list">
        {filtered.map(tpl => (
          <div key={tpl.id} className="qr-item">
            <div className="qr-item-header">
              <span className="qr-item-name">{tpl.name}</span>
              <span className="qr-item-uses">{tpl.usageCount} uses</span>
            </div>
            <div className="qr-item-content">{tpl.content}</div>
            <div className="qr-item-actions">
              <button className="qr-use-btn" onClick={() => handleUse(tpl)}>USE</button>
              <button className="qr-delete-btn" onClick={() => handleDelete(tpl.id)}>DELETE</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
