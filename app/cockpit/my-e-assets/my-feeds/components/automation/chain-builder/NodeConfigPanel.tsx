'use client';

import React, { useState, useEffect } from 'react';
import {
  ChainNode,
  NodeType,
  NODE_CATALOG,
  StartNodeData,
  PullContentNodeData,
  AddCaptionNodeData,
  ScheduleNodeData,
  FilterNodeData,
  ScrapeNodeData,
  DelayNodeData,
} from './types';

interface NodeConfigPanelProps {
  node: ChainNode | null;
  onUpdate: (nodeId: string, data: Partial<ChainNode['data']>) => void;
  onClose: () => void;
}

export const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
  node,
  onUpdate,
  onClose,
}) => {
  if (!node) {
    return (
      <div className="config-panel empty">
        <div className="config-empty">
          <span className="config-empty-icon">👆</span>
          <p>Select a node to configure it</p>
        </div>
      </div>
    );
  }

  const catalogItem = NODE_CATALOG.find(item => item.type === node.type);

  const handleChange = (key: string, value: any) => {
    onUpdate(node.id, { [key]: value });
  };

  const markConfigured = () => {
    onUpdate(node.id, { isConfigured: true });
  };

  return (
    <div className="config-panel">
      <div className="config-header" style={{ borderColor: catalogItem?.color }}>
        <span className="config-icon">{catalogItem?.icon}</span>
        <div className="config-title">
          <h3>{catalogItem?.label}</h3>
          <p>{catalogItem?.description}</p>
        </div>
        <button className="config-close" onClick={onClose}>×</button>
      </div>

      <div className="config-body">
        {/* Start Node Config */}
        {node.type === 'start' && (
          <StartNodeConfig
            data={node.data as StartNodeData}
            onChange={handleChange}
          />
        )}

        {/* Pull Content Node Config */}
        {node.type === 'pull-content' && (
          <PullContentConfig
            data={node.data as PullContentNodeData}
            onChange={handleChange}
          />
        )}

        {/* Add Caption Node Config */}
        {node.type === 'add-caption' && (
          <AddCaptionConfig
            data={node.data as AddCaptionNodeData}
            onChange={handleChange}
          />
        )}

        {/* Schedule Node Config */}
        {node.type === 'schedule' && (
          <ScheduleConfig
            data={node.data as ScheduleNodeData}
            onChange={handleChange}
          />
        )}

        {/* Filter Node Config */}
        {node.type === 'filter' && (
          <FilterConfig
            data={node.data as FilterNodeData}
            onChange={handleChange}
          />
        )}

        {/* Scrape Node Config */}
        {node.type === 'scrape' && (
          <ScrapeConfig
            data={node.data as ScrapeNodeData}
            onChange={handleChange}
          />
        )}

        {/* Delay Node Config */}
        {node.type === 'delay' && (
          <DelayConfig
            data={node.data as DelayNodeData}
            onChange={handleChange}
          />
        )}

        {/* Generic for unimplemented configs */}
        {!['start', 'pull-content', 'add-caption', 'schedule', 'filter', 'scrape', 'delay'].includes(node.type) && (
          <div className="config-placeholder">
            <p>Configuration for this node type coming soon.</p>
          </div>
        )}
      </div>

      <div className="config-footer">
        <button className="config-save" onClick={markConfigured}>
          ✓ Save Configuration
        </button>
      </div>
    </div>
  );
};

// =============================================
// Individual Node Configs
// =============================================

const StartNodeConfig: React.FC<{
  data: StartNodeData;
  onChange: (key: string, value: any) => void;
}> = ({ data, onChange }) => (
  <div className="config-fields">
    <div className="config-field">
      <label>Trigger Type</label>
      <select
        value={data.triggerType || 'schedule'}
        onChange={e => onChange('triggerType', e.target.value)}
      >
        <option value="schedule">On Schedule</option>
        <option value="manual">Manual Trigger</option>
        <option value="new-content">When New Content Available</option>
        <option value="webhook">Webhook</option>
        <option value="event">Platform Event</option>
      </select>
    </div>

    {data.triggerType === 'schedule' && (
      <div className="config-field">
        <label>Schedule Interval</label>
        <select
          value={data.scheduleInterval || 'every-6-hours'}
          onChange={e => onChange('scheduleInterval', e.target.value)}
        >
          <option value="every-hour">Every Hour</option>
          <option value="every-3-hours">Every 3 Hours</option>
          <option value="every-6-hours">Every 6 Hours</option>
          <option value="every-12-hours">Every 12 Hours</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
      </div>
    )}

    <div className="config-field">
      <label>Chain Name</label>
      <input
        type="text"
        value={data.label || ''}
        onChange={e => onChange('label', e.target.value)}
        placeholder="e.g., Daily Content Poster"
      />
    </div>
  </div>
);

const PullContentConfig: React.FC<{
  data: PullContentNodeData;
  onChange: (key: string, value: any) => void;
}> = ({ data, onChange }) => (
  <div className="config-fields">
    <div className="config-field">
      <label>Content Source</label>
      <select
        value={data.source || 'library'}
        onChange={e => onChange('source', e.target.value)}
      >
        <option value="library">Content Library</option>
        <option value="rss">RSS Feed</option>
        <option value="scrape">Scraped Content</option>
        <option value="ai-generate">AI Generated</option>
        <option value="upload">Direct Upload</option>
      </select>
    </div>

    {data.source === 'rss' && (
      <div className="config-field">
        <label>RSS URL</label>
        <input
          type="url"
          value={data.sourceUrl || ''}
          onChange={e => onChange('sourceUrl', e.target.value)}
          placeholder="https://..."
        />
      </div>
    )}

    <div className="config-field">
      <label>Content Type</label>
      <select
        value={data.contentType || 'any'}
        onChange={e => onChange('contentType', e.target.value)}
      >
        <option value="any">Any</option>
        <option value="image">Images Only</option>
        <option value="video">Videos Only</option>
        <option value="carousel">Carousels Only</option>
      </select>
    </div>

    <div className="config-field">
      <label>Selection Method</label>
      <select
        value={data.selectionMethod || 'random'}
        onChange={e => onChange('selectionMethod', e.target.value)}
      >
        <option value="random">Random</option>
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="highest-engagement">Highest Engagement</option>
      </select>
    </div>

    <div className="config-field">
      <label>Items to Pull</label>
      <input
        type="number"
        value={data.limit || 1}
        onChange={e => onChange('limit', parseInt(e.target.value))}
        min={1}
        max={10}
      />
    </div>
  </div>
);

const AddCaptionConfig: React.FC<{
  data: AddCaptionNodeData;
  onChange: (key: string, value: any) => void;
}> = ({ data, onChange }) => (
  <div className="config-fields">
    <div className="config-field">
      <label>Caption Source</label>
      <select
        value={data.captionSource || 'template'}
        onChange={e => onChange('captionSource', e.target.value)}
      >
        <option value="template">Use Template</option>
        <option value="ai-generate">AI Generate</option>
        <option value="original">Keep Original</option>
        <option value="custom">Custom Text</option>
      </select>
    </div>

    {data.captionSource === 'template' && (
      <div className="config-field">
        <label>Caption Template</label>
        <textarea
          value={data.template || ''}
          onChange={e => onChange('template', e.target.value)}
          placeholder="Use {title}, {date}, etc."
          rows={3}
        />
      </div>
    )}

    {data.captionSource === 'ai-generate' && (
      <div className="config-field">
        <label>AI Prompt</label>
        <textarea
          value={data.aiPrompt || ''}
          onChange={e => onChange('aiPrompt', e.target.value)}
          placeholder="Generate an engaging caption for..."
          rows={3}
        />
      </div>
    )}

    <div className="config-field checkbox">
      <label>
        <input
          type="checkbox"
          checked={data.includeHashtags || false}
          onChange={e => onChange('includeHashtags', e.target.checked)}
        />
        Include Hashtags
      </label>
    </div>

    {data.includeHashtags && (
      <div className="config-field">
        <label>Hashtag Strategy</label>
        <select
          value={data.hashtagStrategy || 'niche'}
          onChange={e => onChange('hashtagStrategy', e.target.value)}
        >
          <option value="trending">Trending</option>
          <option value="niche">Niche Specific</option>
          <option value="custom">Custom List</option>
        </select>
      </div>
    )}

    <div className="config-field checkbox">
      <label>
        <input
          type="checkbox"
          checked={data.includeCTA || false}
          onChange={e => onChange('includeCTA', e.target.checked)}
        />
        Include Call-to-Action
      </label>
    </div>
  </div>
);

const ScheduleConfig: React.FC<{
  data: ScheduleNodeData;
  onChange: (key: string, value: any) => void;
}> = ({ data, onChange }) => (
  <div className="config-fields">
    <div className="config-field">
      <label>Schedule Type</label>
      <select
        value={data.scheduleType || 'best-time'}
        onChange={e => onChange('scheduleType', e.target.value)}
      >
        <option value="immediate">Post Immediately</option>
        <option value="best-time">Best Time (AI Optimized)</option>
        <option value="custom">Custom Time</option>
        <option value="queue">Add to Queue</option>
      </select>
    </div>

    {data.scheduleType === 'custom' && (
      <div className="config-field">
        <label>Post Time</label>
        <input
          type="time"
          value={data.customTime || '09:00'}
          onChange={e => onChange('customTime', e.target.value)}
        />
      </div>
    )}

    {data.scheduleType === 'queue' && (
      <div className="config-field">
        <label>Queue Position</label>
        <select
          value={data.queuePosition || 'last'}
          onChange={e => onChange('queuePosition', e.target.value)}
        >
          <option value="next">Next in Queue</option>
          <option value="last">End of Queue</option>
        </select>
      </div>
    )}

    <div className="config-field">
      <label>Timezone</label>
      <select
        value={data.timezone || 'local'}
        onChange={e => onChange('timezone', e.target.value)}
      >
        <option value="local">Local Time</option>
        <option value="UTC">UTC</option>
        <option value="EST">Eastern Time</option>
        <option value="PST">Pacific Time</option>
      </select>
    </div>
  </div>
);

const FilterConfig: React.FC<{
  data: FilterNodeData;
  onChange: (key: string, value: any) => void;
}> = ({ data, onChange }) => (
  <div className="config-fields">
    <div className="config-field">
      <label>Condition Type</label>
      <select
        value={data.conditionType || 'content-type'}
        onChange={e => onChange('conditionType', e.target.value)}
      >
        <option value="content-type">Content Type</option>
        <option value="engagement">Engagement Level</option>
        <option value="time">Time of Day</option>
        <option value="custom">Custom Condition</option>
      </select>
    </div>

    <div className="config-field">
      <label>Operator</label>
      <select
        value={data.operator || 'equals'}
        onChange={e => onChange('operator', e.target.value)}
      >
        <option value="equals">Equals</option>
        <option value="contains">Contains</option>
        <option value="greater-than">Greater Than</option>
        <option value="less-than">Less Than</option>
      </select>
    </div>

    <div className="config-field">
      <label>Value</label>
      <input
        type="text"
        value={data.value || ''}
        onChange={e => onChange('value', e.target.value)}
        placeholder="Enter value..."
      />
    </div>

    <div className="config-info">
      <p>💡 Filter nodes have two outputs: "Yes" (condition met) and "No" (condition not met)</p>
    </div>
  </div>
);

const ScrapeConfig: React.FC<{
  data: ScrapeNodeData;
  onChange: (key: string, value: any) => void;
}> = ({ data, onChange }) => (
  <div className="config-fields">
    <div className="config-field">
      <label>Source Platform</label>
      <select
        value={data.scrapeSource || 'instagram'}
        onChange={e => onChange('scrapeSource', e.target.value)}
      >
        <option value="instagram">Instagram</option>
        <option value="tiktok">TikTok</option>
        <option value="twitter">Twitter/X</option>
        <option value="pinterest">Pinterest</option>
        <option value="custom">Custom URL</option>
      </select>
    </div>

    <div className="config-field">
      <label>Target Type</label>
      <select
        value={data.targetType || 'hashtag'}
        onChange={e => onChange('targetType', e.target.value)}
      >
        <option value="hashtag">Hashtag</option>
        <option value="user">User Profile</option>
        <option value="trending">Trending Content</option>
        <option value="url">Specific URL</option>
      </select>
    </div>

    <div className="config-field">
      <label>
        {data.targetType === 'hashtag' ? 'Hashtag' :
         data.targetType === 'user' ? 'Username' :
         'Target Value'}
      </label>
      <input
        type="text"
        value={data.targetValue || ''}
        onChange={e => onChange('targetValue', e.target.value)}
        placeholder={data.targetType === 'hashtag' ? '#photography' : '@username'}
      />
    </div>

    <div className="config-field">
      <label>Max Items to Scrape</label>
      <input
        type="number"
        value={data.scrapeLimit || 10}
        onChange={e => onChange('scrapeLimit', parseInt(e.target.value))}
        min={1}
        max={50}
      />
    </div>

    <div className="config-field checkbox">
      <label>
        <input
          type="checkbox"
          checked={data.filterNSFW !== false}
          onChange={e => onChange('filterNSFW', e.target.checked)}
        />
        Filter NSFW Content
      </label>
    </div>

    <div className="config-field">
      <label>Minimum Engagement</label>
      <input
        type="number"
        value={data.minEngagement || 0}
        onChange={e => onChange('minEngagement', parseInt(e.target.value))}
        min={0}
        placeholder="Min likes/views"
      />
    </div>
  </div>
);

const DelayConfig: React.FC<{
  data: DelayNodeData;
  onChange: (key: string, value: any) => void;
}> = ({ data, onChange }) => (
  <div className="config-fields">
    <div className="config-field">
      <label>Delay Type</label>
      <select
        value={data.delayType || 'fixed'}
        onChange={e => onChange('delayType', e.target.value)}
      >
        <option value="fixed">Fixed Duration</option>
        <option value="random">Random Range</option>
        <option value="human-like">Human-like (Varies)</option>
      </select>
    </div>

    {data.delayType === 'fixed' && (
      <div className="config-field">
        <label>Duration (seconds)</label>
        <input
          type="number"
          value={data.duration || 60}
          onChange={e => onChange('duration', parseInt(e.target.value))}
          min={1}
        />
      </div>
    )}

    {data.delayType === 'random' && (
      <>
        <div className="config-field">
          <label>Min Duration (seconds)</label>
          <input
            type="number"
            value={data.randomRange?.min || 30}
            onChange={e => onChange('randomRange', { ...data.randomRange, min: parseInt(e.target.value) })}
            min={1}
          />
        </div>
        <div className="config-field">
          <label>Max Duration (seconds)</label>
          <input
            type="number"
            value={data.randomRange?.max || 120}
            onChange={e => onChange('randomRange', { ...data.randomRange, max: parseInt(e.target.value) })}
            min={1}
          />
        </div>
      </>
    )}

    {data.delayType === 'human-like' && (
      <div className="config-info">
        <p>🤖 Human-like delays vary between 30-180 seconds with natural patterns to avoid detection.</p>
      </div>
    )}
  </div>
);

export default NodeConfigPanel;
