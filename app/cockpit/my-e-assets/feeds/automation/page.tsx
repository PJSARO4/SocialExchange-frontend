'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ChainCanvas from './components/ChainCanvas';
import ChainInspector from './components/ChainInspector';
import './automation.css';

interface ChainNode {
  id: string;
  type: 'trigger' | 'content_source' | 'caption' | 'scheduler' | 'dispatch';
  title: string;
  status: string;
  config: Record<string, any>;
}

interface AutomationChain {
  id: string;
  accountId: string;
  status: 'draft' | 'armed' | 'paused';
  nodes: ChainNode[];
}

export default function AutomationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const postId = searchParams.get('post');

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const mockChain: AutomationChain = {
    id: 'chain_1',
    accountId: 'acc_1',
    status: 'armed',
    nodes: [
      {
        id: 'node_1',
        type: 'trigger',
        title: 'Scheduled Trigger',
        status: 'Every day at 9:00 AM',
        config: {
          schedule: '0 9 * * *',
          timezone: 'America/New_York'
        }
      },
      {
        id: 'node_2',
        type: 'content_source',
        title: 'Content Library',
        status: 'Ready • 24 items',
        config: {
          source: 'library',
          libraryId: 'lib_1',
          selectionMode: 'sequential'
        }
      },
      {
        id: 'node_3',
        type: 'caption',
        title: 'Caption Generator',
        status: 'Template configured',
        config: {
          mode: 'template',
          template: 'Check out our latest {product}! #brand #newrelease'
        }
      },
      {
        id: 'node_4',
        type: 'scheduler',
        title: 'Scheduler',
        status: 'Configured',
        config: {
          postTime: '09:00',
          daysOfWeek: [1, 2, 3, 4, 5]
        }
      },
      {
        id: 'node_5',
        type: 'dispatch',
        title: 'Instagram Dispatch',
        status: 'Ready to publish',
        config: {
          platform: 'instagram',
          accountId: 'acc_1'
        }
      }
    ]
  };

  const selectedNode = mockChain.nodes.find(node => node.id === selectedNodeId);

  const handleNodeClick = (nodeId: string) => {
    setSelectedNodeId(nodeId);
  };

  const handleCloseInspector = () => {
    setSelectedNodeId(null);
  };

  const handleSaveChain = () => {
    console.log('Chain saved');
  };

  const handleTestChain = () => {
    console.log('Testing chain');
  };

  return (
    <div className="automation-page">
      <div className="automation-header">
        <div className="automation-title-section">
          <h1 className="automation-title">Automation Builder</h1>
          <p className="automation-subtitle">
            {postId ? `Editing automation for post ${postId}` : 'Create automated content workflows'}
          </p>
        </div>
        <div className="automation-actions">
          <button className="automation-action-button" onClick={() => router.back()}>
            Back
          </button>
          <button className="automation-action-button" onClick={handleTestChain}>
            Test Chain
          </button>
          <button className="automation-action-button primary" onClick={handleSaveChain}>
            Save Chain
          </button>
        </div>
      </div>

      <div className="automation-status-bar">
        <div className="automation-status-item">
          <span className="automation-status-label">Chain Status:</span>
          <span className={`automation-status-badge status-${mockChain.status}`}>
            {mockChain.status.toUpperCase()}
          </span>
        </div>
        <div className="automation-status-item">
          <span className="automation-status-label">Nodes:</span>
          <span className="automation-status-value">{mockChain.nodes.length}</span>
        </div>
        <div className="automation-status-item">
          <span className="automation-status-label">Account:</span>
          <span className="automation-status-value">@urban_signal</span>
        </div>
      </div>

      <div className="automation-workspace">
        <ChainCanvas
          chain={mockChain}
          selectedNodeId={selectedNodeId}
          onNodeClick={handleNodeClick}
        />
        {selectedNode && (
          <ChainInspector
            node={selectedNode}
            onClose={handleCloseInspector}
          />
        )}
      </div>
    </div>
  );
}