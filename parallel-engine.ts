import { ApiClients } from './types';
import { callAI } from './services';

export interface AITask {
  promptKey: string;
  args: any[];
  model: string;
  priority: 'high' | 'medium' | 'low';
  id: string;
}

export interface AIBatchResult {
  id: string;
  success: boolean;
  data: any;
  error?: string;
  duration: number;
}

export class ParallelAIEngine {
  private maxConcurrent: number = 5;
  private activeRequests: number = 0;
  private requestQueue: AITask[] = [];
  private results: Map<string, AIBatchResult> = new Map();

  constructor(maxConcurrent: number = 5) {
    this.maxConcurrent = maxConcurrent;
  }

  async executeBatch(
    tasks: AITask[],
    context: any
  ): Promise<AIBatchResult[]> {
    const priorityGroups = this.groupByPriority(tasks);
    const results: AIBatchResult[] = [];

    for (const [priority, groupTasks] of priorityGroups) {
      const batchResults = await this.executeGroup(groupTasks, context);
      results.push(...batchResults);
    }

    return results;
  }

  async executeParallelBatch(
    tasks: AITask[],
    context: any
  ): Promise<AIBatchResult[]> {
    const chunks = this.chunkTasks(tasks, this.maxConcurrent);
    const allResults: AIBatchResult[] = [];

    for (const chunk of chunks) {
      const chunkResults = await Promise.allSettled(
        chunk.map(task => this.executeTask(task, context))
      );

      const processedResults = chunkResults.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            id: chunk[index].id,
            success: false,
            data: null,
            error: result.reason?.message || 'Unknown error',
            duration: 0
          };
        }
      });

      allResults.push(...processedResults);
    }

    return allResults;
  }

  private async executeTask(task: AITask, context: any): Promise<AIBatchResult> {
    const startTime = performance.now();

    try {
      const result = await callAI(
        task.promptKey,
        task.args,
        context.apiClients,
        context.selectedModel,
        context.openrouterModels,
        context.selectedGroqModel
      );

      const duration = performance.now() - startTime;

      return {
        id: task.id,
        success: true,
        data: result,
        duration
      };
    } catch (error: any) {
      const duration = performance.now() - startTime;

      return {
        id: task.id,
        success: false,
        data: null,
        error: error.message || 'AI call failed',
        duration
      };
    }
  }

  private async executeGroup(
    tasks: AITask[],
    context: any
  ): Promise<AIBatchResult[]> {
    return this.executeParallelBatch(tasks, context);
  }

  private groupByPriority(tasks: AITask[]): Map<string, AITask[]> {
    const groups = new Map<string, AITask[]>();
    const priorities = ['high', 'medium', 'low'];

    priorities.forEach(priority => {
      const filtered = tasks.filter(t => t.priority === priority);
      if (filtered.length > 0) {
        groups.set(priority, filtered);
      }
    });

    return groups;
  }

  private chunkTasks(tasks: AITask[], chunkSize: number): AITask[][] {
    const chunks: AITask[][] = [];
    for (let i = 0; i < tasks.length; i += chunkSize) {
      chunks.push(tasks.slice(i, i + chunkSize));
    }
    return chunks;
  }

  getStats(): {
    totalProcessed: number;
    avgDuration: number;
    successRate: number;
  } {
    const results = Array.from(this.results.values());
    const successful = results.filter(r => r.success).length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    return {
      totalProcessed: results.length,
      avgDuration: results.length > 0 ? totalDuration / results.length : 0,
      successRate: results.length > 0 ? (successful / results.length) * 100 : 0
    };
  }
}

export const createOptimizedAITasks = (
  contentItems: any[],
  operation: 'generate' | 'analyze' | 'optimize'
): AITask[] => {
  return contentItems.map((item, index) => ({
    promptKey: operation,
    args: [item],
    model: 'gemini',
    priority: index < 3 ? 'high' : 'medium',
    id: `${operation}-${item.id || index}`
  }));
};
