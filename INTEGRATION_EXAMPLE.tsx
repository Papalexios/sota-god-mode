import React, { useState, useEffect } from 'react';
import { ParallelAIEngine, createOptimizedAITasks, AITask } from './parallel-engine';
import {
  globalPerformanceTracker,
  calculateContentQualityScore,
  calculateAEOScore,
  calculateInternalLinkDensity,
  calculateSemanticRichness
} from './performance-tracker';
import { globalLinkingEngine } from './internal-linking-engine';
import { globalAEOOptimizer } from './aeo-optimizer';
import { AnalyticsDashboard } from './analytics-dashboard';
import { ContentItem, GeneratedContent, SitemapPage, GenerationContext } from './types';

export const EnhancedContentGenerator: React.FC<{
  items: ContentItem[];
  existingPages: SitemapPage[];
  context: GenerationContext;
  onComplete: (results: any[]) => void;
}> = ({ items, existingPages, context, onComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);

  const generateWithOptimizations = async () => {
    setIsProcessing(true);
    const startTime = performance.now();

    const engine = new ParallelAIEngine(5);

    const tasks: AITask[] = items.map((item, index) => ({
      promptKey: 'generateContent',
      args: [item.title, context],
      model: context.selectedModel,
      priority: index < 3 ? 'high' : 'medium',
      id: item.id
    }));

    try {
      const results = await engine.executeParallelBatch(tasks, context);

      const enhancedResults = results.map((result, index) => {
        if (!result.success || !result.data) return result;

        const generatedContent = result.data as GeneratedContent;

        const linkOpportunities = globalLinkingEngine.generateLinkOpportunities(
          generatedContent.content,
          existingPages,
          15
        );

        const linkedContent = globalLinkingEngine.injectContextualLinks(
          generatedContent.content,
          linkOpportunities
        );

        const aeoResult = globalAEOOptimizer.optimizeForAnswerEngines(
          linkedContent,
          generatedContent.primaryKeyword,
          generatedContent.faqSection
        );

        const enhancedContent: GeneratedContent = {
          ...generatedContent,
          content: aeoResult.optimizedContent
        };

        const qualityScore = calculateContentQualityScore(enhancedContent);
        const aeoScore = calculateAEOScore(enhancedContent);
        const linkDensity = calculateInternalLinkDensity(
          enhancedContent.content,
          existingPages
        );
        const semanticRichness = calculateSemanticRichness(enhancedContent);

        globalPerformanceTracker.recordMetrics({
          optimizationSpeed: result.duration,
          contentQualityScore: qualityScore,
          internalLinkDensity: linkDensity,
          semanticRichness: semanticRichness,
          aeoScore: aeoScore,
          timestamp: Date.now()
        });

        globalPerformanceTracker.recordOptimization({
          id: items[index].id,
          url: items[index].title,
          title: items[index].title,
          timestamp: Date.now(),
          beforeScore: 70,
          afterScore: qualityScore,
          improvements: aeoResult.recommendations,
          duration: result.duration
        });

        setProgress(((index + 1) / results.length) * 100);

        return {
          ...result,
          data: enhancedContent,
          metrics: {
            qualityScore,
            aeoScore,
            linkDensity,
            semanticRichness
          }
        };
      });

      const totalTime = performance.now() - startTime;
      setCurrentSpeed(totalTime / items.length);

      onComplete(enhancedResults);
    } catch (error) {
      console.error('Enhanced generation failed:', error);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <div>
      <button
        onClick={generateWithOptimizations}
        disabled={isProcessing}
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: isProcessing ? '#6b7280' : '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: isProcessing ? 'not-allowed' : 'pointer',
          fontSize: '1rem',
          fontWeight: 'bold',
          marginBottom: '1rem'
        }}
      >
        {isProcessing
          ? `Processing... ${Math.round(progress)}%`
          : '🚀 Generate with Advanced Optimizations'}
      </button>

      {isProcessing && (
        <div style={{ marginBottom: '2rem' }}>
          <div
            style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#1e2433',
              borderRadius: '4px',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                backgroundColor: '#3b82f6',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
          <div
            style={{
              marginTop: '0.5rem',
              fontSize: '0.875rem',
              color: '#6b7280',
              textAlign: 'center'
            }}
          >
            Avg Speed: {currentSpeed.toFixed(0)}ms per item
          </div>
        </div>
      )}

      <AnalyticsDashboard existingPages={existingPages} />
    </div>
  );
};

export const SmartLinkInjector: React.FC<{
  content: string;
  existingPages: SitemapPage[];
  onLinksGenerated: (content: string, opportunities: any[]) => void;
}> = ({ content, existingPages, onLinksGenerated }) => {
  const [linkOpportunities, setLinkOpportunities] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateLinks = async () => {
    setIsGenerating(true);

    const opportunities = globalLinkingEngine.generateLinkOpportunities(
      content,
      existingPages,
      15
    );

    setLinkOpportunities(opportunities);

    const linkedContent = globalLinkingEngine.injectContextualLinks(
      content,
      opportunities
    );

    onLinksGenerated(linkedContent, opportunities);
    setIsGenerating(false);
  };

  return (
    <div>
      <button
        onClick={generateLinks}
        disabled={isGenerating}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: 'bold'
        }}
      >
        {isGenerating ? 'Analyzing...' : '🔗 Generate Smart Links'}
      </button>

      {linkOpportunities.length > 0 && (
        <div
          style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: '#0f1118',
            borderRadius: '8px',
            border: '1px solid #1e2433'
          }}
        >
          <h4 style={{ color: '#EAEBF2', marginBottom: '0.75rem' }}>
            {linkOpportunities.length} Link Opportunities Found
          </h4>
          {linkOpportunities.slice(0, 5).map((opp, index) => (
            <div
              key={index}
              style={{
                padding: '0.5rem',
                marginBottom: '0.5rem',
                backgroundColor: '#1a1f2e',
                borderRadius: '4px',
                fontSize: '0.875rem',
                color: '#A0A8C2'
              }}
            >
              <strong style={{ color: '#60a5fa' }}>{opp.anchorText}</strong> →{' '}
              {opp.toPage} (Score: {opp.relevanceScore})
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const AEOScoreCard: React.FC<{ content: GeneratedContent }> = ({
  content
}) => {
  const [aeoResult, setAeoResult] = useState<any>(null);

  useEffect(() => {
    const result = globalAEOOptimizer.optimizeForAnswerEngines(
      content.content,
      content.primaryKeyword,
      content.faqSection
    );
    setAeoResult(result);
  }, [content]);

  if (!aeoResult) return null;

  return (
    <div
      style={{
        padding: '1.5rem',
        backgroundColor: '#0f1118',
        borderRadius: '8px',
        border: '1px solid #1e2433',
        marginTop: '1rem'
      }}
    >
      <h3 style={{ color: '#EAEBF2', marginBottom: '1rem' }}>
        AEO Optimization Score
      </h3>

      <div
        style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          color: aeoResult.overallScore >= 80 ? '#10b981' : '#f59e0b',
          marginBottom: '1rem'
        }}
      >
        {Math.round(aeoResult.overallScore)}/100
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <h4 style={{ color: '#A0A8C2', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
          Optimized Snippet Types:
        </h4>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {aeoResult.snippets.map((snippet: any, index: number) => (
            <span
              key={index}
              style={{
                padding: '0.25rem 0.75rem',
                backgroundColor: '#1a1f2e',
                color: '#60a5fa',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}
            >
              {snippet.type}
            </span>
          ))}
        </div>
      </div>

      {aeoResult.recommendations.length > 0 && (
        <div>
          <h4 style={{ color: '#A0A8C2', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            Recommendations:
          </h4>
          <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
            {aeoResult.recommendations.map((rec: string, index: number) => (
              <li key={index} style={{ marginBottom: '0.25rem' }}>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export const TopicClusterVisualization: React.FC<{
  existingPages: SitemapPage[];
}> = ({ existingPages }) => {
  const [clusters, setClusters] = useState<any[]>([]);
  const [linkingStrategy, setLinkingStrategy] = useState<any>(null);

  useEffect(() => {
    if (existingPages.length > 0) {
      const identifiedClusters = globalLinkingEngine.identifyTopicClusters(
        existingPages
      );
      setClusters(identifiedClusters.slice(0, 10));

      const strategy = globalLinkingEngine.generateSmartLinkingStrategy(
        identifiedClusters
      );
      setLinkingStrategy(strategy);
    }
  }, [existingPages]);

  if (clusters.length === 0) return null;

  return (
    <div
      style={{
        padding: '2rem',
        backgroundColor: '#0f1118',
        borderRadius: '12px',
        border: '1px solid #1e2433',
        marginTop: '2rem'
      }}
    >
      <h2 style={{ color: '#EAEBF2', marginBottom: '1.5rem' }}>
        📊 Topic Cluster Analysis
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {clusters.map((cluster, index) => (
          <div
            key={index}
            style={{
              padding: '1.5rem',
              backgroundColor: '#1a1f2e',
              borderRadius: '8px',
              border: '1px solid #2d3548'
            }}
          >
            <div
              style={{
                fontSize: '1.125rem',
                fontWeight: 'bold',
                color: '#60a5fa',
                marginBottom: '0.75rem'
              }}
            >
              Cluster {index + 1}: {cluster.pillarPage.title}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '0.5rem',
                marginBottom: '0.75rem'
              }}
            >
              {cluster.clusterPages.slice(0, 6).map((page: SitemapPage, pIndex: number) => (
                <div
                  key={pIndex}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: '#0f1118',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    color: '#A0A8C2',
                    border: '1px solid #2d3548'
                  }}
                >
                  {page.title}
                </div>
              ))}
            </div>

            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              {cluster.clusterPages.length} related pages • Topic Relevance:{' '}
              {Math.round(cluster.topicRelevance)}/100
            </div>
          </div>
        ))}
      </div>

      {linkingStrategy && (
        <div
          style={{
            marginTop: '2rem',
            padding: '1.5rem',
            backgroundColor: '#1a1f2e',
            borderRadius: '8px',
            border: '1px solid #2d3548'
          }}
        >
          <h3 style={{ color: '#EAEBF2', marginBottom: '1rem' }}>
            💡 Smart Linking Recommendations
          </h3>
          <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#A0A8C2', fontSize: '0.875rem' }}>
            {linkingStrategy.recommendations.slice(0, 5).map((rec: string, index: number) => (
              <li key={index} style={{ marginBottom: '0.5rem' }}>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
