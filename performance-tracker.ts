export interface PerformanceMetrics {
  optimizationSpeed: number;
  contentQualityScore: number;
  internalLinkDensity: number;
  semanticRichness: number;
  aeoScore: number;
  timestamp: number;
}

export interface OptimizationLog {
  id: string;
  url: string;
  title: string;
  timestamp: number;
  beforeScore: number;
  afterScore: number;
  improvements: string[];
  duration: number;
}

export class PerformanceTracker {
  private metrics: PerformanceMetrics[] = [];
  private logs: OptimizationLog[] = [];
  private readonly MAX_HISTORY = 100;

  recordMetrics(metrics: PerformanceMetrics): void {
    this.metrics.push({
      ...metrics,
      timestamp: Date.now()
    });

    if (this.metrics.length > this.MAX_HISTORY) {
      this.metrics = this.metrics.slice(-this.MAX_HISTORY);
    }

    this.saveToStorage();
  }

  recordOptimization(log: OptimizationLog): void {
    this.logs.push(log);

    if (this.logs.length > this.MAX_HISTORY) {
      this.logs = this.logs.slice(-this.MAX_HISTORY);
    }

    this.saveToStorage();
  }

  getRecentMetrics(count: number = 10): PerformanceMetrics[] {
    return this.metrics.slice(-count);
  }

  getRecentLogs(count: number = 20): OptimizationLog[] {
    return this.logs.slice(-count);
  }

  getAverageMetrics(): PerformanceMetrics | null {
    if (this.metrics.length === 0) return null;

    const sum = this.metrics.reduce(
      (acc, m) => ({
        optimizationSpeed: acc.optimizationSpeed + m.optimizationSpeed,
        contentQualityScore: acc.contentQualityScore + m.contentQualityScore,
        internalLinkDensity: acc.internalLinkDensity + m.internalLinkDensity,
        semanticRichness: acc.semanticRichness + m.semanticRichness,
        aeoScore: acc.aeoScore + m.aeoScore,
        timestamp: 0
      }),
      {
        optimizationSpeed: 0,
        contentQualityScore: 0,
        internalLinkDensity: 0,
        semanticRichness: 0,
        aeoScore: 0,
        timestamp: 0
      }
    );

    const count = this.metrics.length;

    return {
      optimizationSpeed: sum.optimizationSpeed / count,
      contentQualityScore: sum.contentQualityScore / count,
      internalLinkDensity: sum.internalLinkDensity / count,
      semanticRichness: sum.semanticRichness / count,
      aeoScore: sum.aeoScore / count,
      timestamp: Date.now()
    };
  }

  getPerformanceTrend(): 'improving' | 'stable' | 'declining' {
    if (this.metrics.length < 5) return 'stable';

    const recent = this.metrics.slice(-5);
    const older = this.metrics.slice(-10, -5);

    if (older.length === 0) return 'stable';

    const recentAvg = recent.reduce((sum, m) => sum + m.contentQualityScore, 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + m.contentQualityScore, 0) / older.length;

    const diff = recentAvg - olderAvg;

    if (diff > 2) return 'improving';
    if (diff < -2) return 'declining';
    return 'stable';
  }

  getTotalOptimizations(): number {
    return this.logs.length;
  }

  getAverageImprovement(): number {
    if (this.logs.length === 0) return 0;

    const improvements = this.logs.map(log => log.afterScore - log.beforeScore);
    const sum = improvements.reduce((acc, val) => acc + val, 0);

    return sum / improvements.length;
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('performanceMetrics', JSON.stringify(this.metrics));
      localStorage.setItem('optimizationLogs', JSON.stringify(this.logs));
    } catch (error) {
      console.error('Failed to save performance data:', error);
    }
  }

  loadFromStorage(): void {
    try {
      const metricsData = localStorage.getItem('performanceMetrics');
      const logsData = localStorage.getItem('optimizationLogs');

      if (metricsData) {
        this.metrics = JSON.parse(metricsData);
      }

      if (logsData) {
        this.logs = JSON.parse(logsData);
      }
    } catch (error) {
      console.error('Failed to load performance data:', error);
    }
  }

  clear(): void {
    this.metrics = [];
    this.logs = [];
    localStorage.removeItem('performanceMetrics');
    localStorage.removeItem('optimizationLogs');
  }
}

export const calculateContentQualityScore = (content: any): number => {
  let score = 0;

  if (content.title && content.title.length > 20) score += 10;
  if (content.metaDescription && content.metaDescription.length >= 120) score += 10;
  if (content.semanticKeywords && content.semanticKeywords.length >= 5) score += 15;
  if (content.content && content.content.length > 1000) score += 20;
  if (content.imageDetails && content.imageDetails.length >= 2) score += 10;
  if (content.faqSection && content.faqSection.length >= 3) score += 10;
  if (content.jsonLdSchema) score += 10;
  if (content.references && content.references.length >= 3) score += 15;

  return Math.min(score, 100);
};

export const calculateInternalLinkDensity = (content: string, existingPages: any[]): number => {
  const linkMatches = content.match(/href=["']([^"']+)["']/g) || [];
  const internalLinks = linkMatches.filter(link => {
    return existingPages.some(page => link.includes(page.slug));
  });

  const wordCount = content.split(/\s+/).length;
  const linksPerHundred = (internalLinks.length / wordCount) * 100;

  return Math.min(linksPerHundred * 10, 100);
};

export const calculateSemanticRichness = (content: any): number => {
  let score = 0;

  const semanticKeywords = content.semanticKeywords?.length || 0;
  score += Math.min(semanticKeywords * 5, 30);

  const hasStrategy = content.strategy ? 20 : 0;
  score += hasStrategy;

  const hasFAQ = content.faqSection?.length >= 3 ? 20 : 0;
  score += hasFAQ;

  const hasReferences = content.references?.length >= 3 ? 15 : 0;
  score += hasReferences;

  const hasTakeaways = content.keyTakeaways?.length >= 3 ? 15 : 0;
  score += hasTakeaways;

  return Math.min(score, 100);
};

export const calculateAEOScore = (content: any): number => {
  let score = 0;

  const hasConciseAnswer = content.content?.includes('<p>') &&
    content.content.indexOf('</p>') < 300;
  if (hasConciseAnswer) score += 20;

  const hasList = content.content?.includes('<ul>') || content.content?.includes('<ol>');
  if (hasList) score += 15;

  const hasTable = content.content?.includes('<table>');
  if (hasTable) score += 15;

  const hasFAQ = content.faqSection && content.faqSection.length >= 3;
  if (hasFAQ) score += 25;

  const hasSchema = content.jsonLdSchema && Object.keys(content.jsonLdSchema).length > 0;
  if (hasSchema) score += 25;

  return Math.min(score, 100);
};

export const globalPerformanceTracker = new PerformanceTracker();
