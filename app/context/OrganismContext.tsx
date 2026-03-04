'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import type {
  OrganismMood,
  OrganismTask,
  OrganismConfig,
  ChatMessage,
  ActivityNotification,
  OrganismAction,
  PlatformName,
  CopilotBridgeItem,
} from '@/app/cockpit/my-e-assets/my-e-storage/organism/types/organism';
import * as oStore from '@/app/cockpit/my-e-assets/my-e-storage/organism/lib/organism-store';
import { isBehaviorEnabled } from '@/app/cockpit/my-e-assets/my-e-storage/organism/lib/organism-store';
import {
  compressForPlatform,
  generateTagsFromFilename,
} from '@/app/cockpit/my-e-assets/my-e-storage/organism/lib/compression-engine';
import { getLocalFallbackResponse } from '@/app/cockpit/my-e-assets/my-e-storage/organism/lib/qwen-client';
import { useEStorage } from './EStorageContext';

// ============================================
// CONTEXT TYPE
// ============================================

interface OrganismContextType {
  // State
  mood: OrganismMood;
  config: OrganismConfig;
  tasks: OrganismTask[];
  chatHistory: ChatMessage[];
  notifications: ActivityNotification[];
  isProcessing: boolean;
  isPanelOpen: boolean;

  // Panel
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;

  // Chat
  sendMessage: (message: string) => Promise<void>;
  clearChat: () => void;

  // Tasks
  runTask: (task: Omit<OrganismTask, 'id' | 'createdAt' | 'status'>) => void;
  getRunningTask: () => OrganismTask | undefined;

  // Config
  updateConfig: (updates: Partial<OrganismConfig>) => void;
  toggleBehavior: (behaviorId: string) => void;
  saveTraining: (training: string) => void;

  // Notifications
  dismissNotification: (id: string) => void;

  // Copilot Bridge
  clipForCopilot: (itemIds: string[]) => void;
  getCopilotClipboard: () => CopilotBridgeItem[];
}

// ============================================
// CONTEXT
// ============================================

const OrganismContext = createContext<OrganismContextType | null>(null);

// ============================================
// HELPERS
// ============================================

function generateId(): string {
  return `syn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ============================================
// PROVIDER
// ============================================

export function OrganismProvider({ children }: { children: ReactNode }) {
  const eStorage = useEStorage();

  const [mood, setMood] = useState<OrganismMood>('idle');
  const [config, setConfig] = useState<OrganismConfig>(oStore.getOrganismConfig());
  const [tasks, setTasks] = useState<OrganismTask[]>(oStore.getTaskQueue());
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(oStore.getChatHistory());
  const [notifications, setNotifications] = useState<ActivityNotification[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Track previous item count to detect new uploads
  const prevItemCount = useRef(eStorage.items.length);
  const taskRunning = useRef(false);
  const tasksRef = useRef<OrganismTask[]>(tasks);

  // ============================================
  // PANEL CONTROLS
  // ============================================

  const openPanel = useCallback(() => setIsPanelOpen(true), []);
  const closePanel = useCallback(() => setIsPanelOpen(false), []);
  const togglePanel = useCallback(() => setIsPanelOpen((p) => !p), []);

  // ============================================
  // NOTIFICATION HELPERS
  // ============================================

  const pushNotification = useCallback((icon: string, message: string) => {
    const notif: ActivityNotification = {
      id: generateId(),
      icon,
      message,
      timestamp: new Date().toISOString(),
      dismissed: false,
    };
    setNotifications((prev) => [...prev.slice(-4), notif]); // keep last 5

    // Auto-dismiss after 5s
    setTimeout(() => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, dismissed: true } : n))
      );
    }, 5000);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, dismissed: true } : n))
    );
  }, []);

  // ============================================
  // CHAT
  // ============================================

  const sendMessage = useCallback(
    async (message: string) => {
      // Add user message
      const userMsg: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      };

      setChatHistory((prev) => {
        const updated = [...prev, userMsg];
        oStore.saveChatHistory(updated);
        return updated;
      });

      setMood('thinking');
      setIsProcessing(true);

      try {
        // Try API first
        let responseContent: string;
        let responseActions: OrganismAction[] | undefined;

        try {
          const res = await fetch('/api/organism/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message,
              context: {
                totalItems: eStorage.items.length,
                usedPercent: eStorage.stats?.usedPercent || 0,
                recentActivity: tasks
                  .filter((t) => t.status === 'completed')
                  .slice(0, 3)
                  .map((t) => t.description)
                  .join(', '),
                userTraining: config.userTraining,
              },
            }),
          });

          if (res.ok) {
            const data = await res.json();
            responseContent = data.reply;
            responseActions = data.suggestedActions;
          } else {
            throw new Error('API failed');
          }
        } catch {
          // Fallback to local pattern-matching
          const fallback = getLocalFallbackResponse(message, {
            totalItems: eStorage.items.length,
            usedPercent: eStorage.stats?.usedPercent || 0,
          });
          responseContent = fallback.content;
          responseActions = fallback.actions as OrganismAction[] | undefined;
        }

        const assistantMsg: ChatMessage = {
          id: generateId(),
          role: 'organism',
          content: responseContent,
          timestamp: new Date().toISOString(),
          actions: responseActions,
        };

        setChatHistory((prev) => {
          const updated = [...prev, assistantMsg];
          oStore.saveChatHistory(updated);
          return updated;
        });

        setMood('happy');
        setTimeout(() => setMood('idle'), 2000);
      } catch (err) {
        console.error('[SYN] Chat error:', err);
        setMood('alert');
        setTimeout(() => setMood('idle'), 2000);
      } finally {
        setIsProcessing(false);
      }
    },
    [eStorage.items.length, eStorage.stats, tasks, config.userTraining]
  );

  const clearChat = useCallback(() => {
    setChatHistory([]);
    oStore.clearChatHistory();
  }, []);

  // ============================================
  // TASK EXECUTION
  // ============================================

  const executeTask = useCallback(
    async (task: OrganismTask) => {
      if (taskRunning.current) return;
      taskRunning.current = true;

      const updatedTask = {
        ...task,
        status: 'running' as const,
        startedAt: new Date().toISOString(),
      };
      setTasks((prev) => {
        const updated = prev.map((t) => (t.id === task.id ? updatedTask : t));
        oStore.saveTaskQueue(updated);
        return updated;
      });
      setMood('working');

      try {
        let result = '';

        switch (task.type) {
          case 'compress': {
            if (task.targetItems && task.targetItems.length > 0) {
              let totalSavings = 0;
              let compressedCount = 0;
              const platform = (config.compressionDefaults.platform ||
                'instagram-square') as PlatformName;

              for (const itemId of task.targetItems) {
                const item = eStorage.items.find((i) => i.id === itemId);
                if (!item || item.type !== 'image') continue;

                try {
                  const blobUrl = await eStorage.getBlobUrl(item.blobKey);
                  if (!blobUrl) continue;

                  // Fetch blob from object URL, always revoke
                  let originalBlob: Blob;
                  try {
                    const response = await fetch(blobUrl);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    originalBlob = await response.blob();
                  } finally {
                    URL.revokeObjectURL(blobUrl);
                  }

                  const compressed = await compressForPlatform(
                    originalBlob,
                    platform
                  );

                  // Save compressed version
                  const compressedFilename = `${item.title}_compressed.jpg`;
                  await eStorage.addFromBlob(compressed.blob, compressedFilename, {
                    folder: item.folder,
                    tags: [...item.tags, 'compressed', platform],
                    source: 'organism' as never,
                  });

                  totalSavings += compressed.savings;
                  compressedCount++;
                } catch (err) {
                  console.error(`[SYN] Compress failed for ${itemId}:`, err);
                }
              }

              const avgSavings = compressedCount > 0
                ? Math.round(totalSavings / compressedCount)
                : 0;
              result = `Compressed ${compressedCount} image${compressedCount !== 1 ? 's' : ''} — avg ${avgSavings}% saved`;
              if (compressedCount > 0) {
                pushNotification('🗜', result);
              }
            }
            break;
          }

          case 'tag': {
            let taggedCount = 0;
            for (const item of eStorage.items) {
              if (item.tags.length === 0) {
                const newTags = generateTagsFromFilename(item.filename);
                if (newTags.length > 0) {
                  eStorage.updateItem(item.id, { tags: newTags });
                  taggedCount++;
                }
              }
            }
            result = `Tagged ${taggedCount} file${taggedCount !== 1 ? 's' : ''}`;
            if (taggedCount > 0) pushNotification('🏷', result);
            break;
          }

          case 'organize': {
            // Group unsorted items by type into folders
            const unsorted = eStorage.items.filter(
              (i) => i.folder === 'Unsorted'
            );
            const typeGroups: Record<string, string[]> = {};
            unsorted.forEach((item) => {
              const folder =
                item.type === 'image'
                  ? 'Images'
                  : item.type === 'video'
                    ? 'Videos'
                    : item.type === 'audio'
                      ? 'Audio'
                      : 'Documents';
              if (!typeGroups[folder]) typeGroups[folder] = [];
              typeGroups[folder].push(item.id);
            });

            for (const [folderName, ids] of Object.entries(typeGroups)) {
              eStorage.createFolder(folderName);
              eStorage.moveToFolder(ids, folderName);
            }

            const movedCount = unsorted.length;
            result = `Organized ${movedCount} file${movedCount !== 1 ? 's' : ''} into ${Object.keys(typeGroups).length} folder${Object.keys(typeGroups).length !== 1 ? 's' : ''}`;
            if (movedCount > 0) pushNotification('📂', result);
            break;
          }

          case 'format-check': {
            const nonCompliant: string[] = [];
            for (const item of eStorage.items) {
              if (
                item.type === 'image' &&
                item.dimensions &&
                (item.dimensions.width < 1080 || item.dimensions.height < 1080)
              ) {
                nonCompliant.push(item.title);
              }
            }
            result =
              nonCompliant.length > 0
                ? `${nonCompliant.length} image${nonCompliant.length !== 1 ? 's' : ''} below 1080px — may need upscaling`
                : 'All images meet minimum specs';
            pushNotification('✅', result);
            break;
          }

          default:
            result = `Task type "${task.type}" completed`;
        }

        // Mark complete
        setTasks((prev) => {
          const updated = prev.map((t) =>
            t.id === task.id
              ? {
                  ...t,
                  status: 'completed' as const,
                  result,
                  completedAt: new Date().toISOString(),
                }
              : t
          );
          oStore.saveTaskQueue(updated);
          return updated;
        });

        setMood('happy');
        setTimeout(() => setMood('idle'), 3000);
      } catch (err) {
        console.error('[SYN] Task execution error:', err);
        setTasks((prev) => {
          const updated = prev.map((t) =>
            t.id === task.id
              ? {
                  ...t,
                  status: 'failed' as const,
                  error: String(err),
                  completedAt: new Date().toISOString(),
                }
              : t
          );
          oStore.saveTaskQueue(updated);
          return updated;
        });
        setMood('alert');
        setTimeout(() => setMood('idle'), 3000);
      } finally {
        taskRunning.current = false;
      }
    },
    [eStorage, config, pushNotification]
  );

  // ============================================
  // RUN TASK (Public API)
  // ============================================

  const runTask = useCallback(
    (taskInput: Omit<OrganismTask, 'id' | 'createdAt' | 'status'>) => {
      const task: OrganismTask = {
        ...taskInput,
        id: generateId(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      setTasks((prev) => {
        const updated = [task, ...prev];
        oStore.saveTaskQueue(updated);
        return updated;
      });
    },
    []
  );

  const getRunningTaskFn = useCallback(() => {
    return tasks.find((t) => t.status === 'running');
  }, [tasks]);

  // ============================================
  // CONFIG
  // ============================================

  const updateConfig = useCallback((updates: Partial<OrganismConfig>) => {
    setConfig((prev) => {
      const updated = { ...prev, ...updates };
      oStore.saveOrganismConfig(updated);
      return updated;
    });
  }, []);

  const toggleBehavior = useCallback((behaviorId: string) => {
    setConfig((prev) => {
      const updated = {
        ...prev,
        behaviors: prev.behaviors.map((b) =>
          b.id === behaviorId ? { ...b, enabled: !b.enabled } : b
        ),
      };
      oStore.saveOrganismConfig(updated);
      return updated;
    });
  }, []);

  const saveTraining = useCallback((training: string) => {
    setConfig((prev) => {
      const updated = { ...prev, userTraining: training };
      oStore.saveOrganismConfig(updated);
      return updated;
    });
  }, []);

  // ============================================
  // COPILOT BRIDGE
  // ============================================

  const COPILOT_CLIPBOARD_KEY = 'sx_organism_clipboard';

  const clipForCopilot = useCallback(
    (itemIds: string[]) => {
      const clipped: CopilotBridgeItem[] = itemIds
        .map((id) => {
          const item = eStorage.items.find((i) => i.id === id);
          if (!item) return null;
          return {
            id: item.id,
            title: item.title,
            type: item.type,
            tags: item.tags,
            folder: item.folder,
            clippedAt: new Date().toISOString(),
            description: item.description,
          };
        })
        .filter(Boolean) as CopilotBridgeItem[];

      if (clipped.length > 0) {
        // Merge with existing clipboard (keep last 20)
        try {
          const existing = JSON.parse(
            localStorage.getItem(COPILOT_CLIPBOARD_KEY) || '[]'
          );
          const merged = [...clipped, ...existing].slice(0, 20);
          localStorage.setItem(COPILOT_CLIPBOARD_KEY, JSON.stringify(merged));
          pushNotification(
            '📋',
            `Clipped ${clipped.length} item${clipped.length !== 1 ? 's' : ''} for Copilot`
          );
        } catch (err) {
          console.warn('[SYN] Clipboard operation failed:', err);
          try {
            localStorage.setItem(
              COPILOT_CLIPBOARD_KEY,
              JSON.stringify(clipped)
            );
            pushNotification(
              '📋',
              `Clipped ${clipped.length} item${clipped.length !== 1 ? 's' : ''} for Copilot`
            );
          } catch (quotaErr) {
            console.error('[SYN] Clipboard quota exceeded:', quotaErr);
            pushNotification('⚠', 'Clipboard storage full');
          }
        }
      }
    },
    [eStorage.items, pushNotification]
  );

  const getCopilotClipboard = useCallback((): CopilotBridgeItem[] => {
    try {
      return JSON.parse(
        localStorage.getItem(COPILOT_CLIPBOARD_KEY) || '[]'
      );
    } catch {
      return [];
    }
  }, []);

  // ============================================
  // AUTONOMOUS TASK RUNNER (10s interval)
  // ============================================

  // Keep tasksRef in sync to avoid stale closures
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (taskRunning.current) return;

      // Use ref to avoid stale closure
      const pending = tasksRef.current.find((t) => t.status === 'pending');
      if (pending) {
        executeTask(pending);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [executeTask]);

  // ============================================
  // WATCH E-STORAGE FOR NEW UPLOADS
  // ============================================

  useEffect(() => {
    const currentCount = eStorage.items.length;
    if (currentCount > prevItemCount.current && prevItemCount.current > 0) {
      // New items were added
      const newItems = eStorage.items.slice(prevItemCount.current);

      newItems.forEach((item) => {
        // Auto-compress behavior
        if (
          item.type === 'image' &&
          isBehaviorEnabled('auto-compress')
        ) {
          runTask({
            type: 'compress',
            description: `Compressing ${item.title} for social media`,
            targetItems: [item.id],
          });
        }

        // Auto-tag behavior
        if (isBehaviorEnabled('auto-tag') && item.tags.length === 0) {
          const tags = generateTagsFromFilename(item.filename);
          if (tags.length > 0) {
            eStorage.updateItem(item.id, { tags });
          }
        }
      });
    }
    prevItemCount.current = currentCount;
  }, [eStorage.items.length, eStorage, runTask]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <OrganismContext.Provider
      value={{
        mood,
        config,
        tasks,
        chatHistory,
        notifications,
        isProcessing,
        isPanelOpen,
        openPanel,
        closePanel,
        togglePanel,
        sendMessage,
        clearChat,
        runTask,
        getRunningTask: getRunningTaskFn,
        updateConfig,
        toggleBehavior,
        saveTraining,
        dismissNotification,
        clipForCopilot,
        getCopilotClipboard,
      }}
    >
      {children}
    </OrganismContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useOrganism(): OrganismContextType {
  const ctx = useContext(OrganismContext);
  if (!ctx) {
    throw new Error('useOrganism must be used within OrganismProvider');
  }
  return ctx;
}
