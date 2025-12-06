import React, { useState, useEffect } from 'react';
import { globalPerformanceTracker, PerformanceMetrics } from './performance-tracker';
import { globalLinkingEngine } from './internal-linking-engine';
import { SitemapPage } from './types';

interface AnalyticsDashboardProps {
  existingPages: SitemapPage[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ existingPages }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [trend, setTrend] = useState<'improving' | 'stable' | 'declining'>('stable');
  const [totalOptimizations, setTotalOptimizations] = useState(0);
  const [avgImprovement, setAvgImprovement] = useState(0);
  const [linkClusters, setLinkClusters] = useState<any[]>([]);

  useEffect(() => {
    globalPerformanceTracker.loadFromStorage();
    updateMetrics();

    const interval = setInterval(updateMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (existingPages.length > 0) {
      const clusters = globalLinkingEngine.identifyTopicClusters(existingPages);
      setLinkClusters(clusters.slice(0, 5));
    }
  }, [existingPages]);

  const updateMetrics = () => {
    const avg = globalPerformanceTracker.getAverageMetrics();
    const currentTrend = globalPerformanceTracker.getPerformanceTrend();
    const total = globalPerformanceTracker.getTotalOptimizations();
    const improvement = globalPerformanceTracker.getAverageImprovement();

    setMetrics(avg);
    setTrend(currentTrend);
    setTotalOptimizations(total);
    setAvgImprovement(improvement);
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'improving':
        return '↗️';
      case 'declining':
        return '↘️';
      default:
        return '→';
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'improving':
        return '#10b981';
      case 'declining':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <div style={{
      padding: '2rem',
      backgroundColor: '#0f1118',
      borderRadius: '12px',
      border: '1px solid #1e2433',
      marginBottom: '2rem'
    }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#EAEBF2',
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          Performance Analytics
          <span style={{ fontSize: '1rem', color: getTrendColor() }}>
            {getTrendIcon()} {trend}
          </span>
        </h2>
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          Real-time optimization metrics and insights
        </p>
      </div>

      {metrics ? (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <MetricCard
              title="Content Quality"
              value={Math.round(metrics.contentQualityScore)}
              max={100}
              color="#3b82f6"
              unit="/100"
            />
            <MetricCard
              title="AEO Score"
              value={Math.round(metrics.aeoScore)}
              max={100}
              color="#10b981"
              unit="/100"
            />
            <MetricCard
              title="Semantic Richness"
              value={Math.round(metrics.semanticRichness)}
              max={100}
              color="#8b5cf6"
              unit="/100"
            />
            <MetricCard
              title="Link Density"
              value={Math.round(metrics.internalLinkDensity)}
              max={100}
              color="#f59e0b"
              unit="/100"
            />
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <StatsCard
              title="Total Optimizations"
              value={totalOptimizations}
              icon="🎯"
            />
            <StatsCard
              title="Avg Improvement"
              value={`+${avgImprovement.toFixed(1)}%`}
              icon="📈"
            />
            <StatsCard
              title="Processing Speed"
              value={`${(metrics.optimizationSpeed / 1000).toFixed(1)}s`}
              icon="⚡"
            />
          </div>

          {linkClusters.length > 0 && (
            <div style={{
              backgroundColor: '#1a1f2e',
              borderRadius: '8px',
              padding: '1.5rem',
              border: '1px solid #2d3548'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: 'bold',
                color: '#EAEBF2',
                marginBottom: '1rem'
              }}>
                Topic Clusters Identified
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {linkClusters.map((cluster, index) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor: '#0f1118',
                      padding: '1rem',
                      borderRadius: '6px',
                      border: '1px solid #2d3548'
                    }}
                  >
                    <div style={{
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      color: '#60a5fa',
                      marginBottom: '0.25rem'
                    }}>
                      {cluster.pillarPage.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {cluster.clusterPages.length} related pages •
                      Relevance: {Math.round(cluster.topicRelevance)}/100
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={{
          textAlign: 'center',
          color: '#6b7280',
          padding: '3rem',
          fontSize: '0.875rem'
        }}>
          No performance data available yet. Start optimizing content to see metrics.
        </div>
      )}
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: number;
  max: number;
  color: string;
  unit: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, max, color, unit }) => {
  const percentage = (value / max) * 100;

  return (
    <div style={{
      backgroundColor: '#1a1f2e',
      padding: '1.25rem',
      borderRadius: '8px',
      border: '1px solid #2d3548'
    }}>
      <div style={{
        fontSize: '0.75rem',
        color: '#6b7280',
        marginBottom: '0.5rem',
        textTransform: 'uppercase',
        fontWeight: 'bold',
        letterSpacing: '0.05em'
      }}>
        {title}
      </div>
      <div style={{
        fontSize: '1.875rem',
        fontWeight: 'bold',
        color: '#EAEBF2',
        marginBottom: '0.75rem'
      }}>
        {value}<span style={{ fontSize: '1rem', color: '#6b7280' }}>{unit}</span>
      </div>
      <div style={{
        width: '100%',
        height: '6px',
        backgroundColor: '#0f1118',
        borderRadius: '3px',
        overflow: 'hidden'
      }}>
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: color,
            transition: 'width 0.5s ease'
          }}
        />
      </div>
    </div>
  );
};

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon }) => {
  return (
    <div style={{
      backgroundColor: '#1a1f2e',
      padding: '1.25rem',
      borderRadius: '8px',
      border: '1px solid #2d3548',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    }}>
      <div style={{ fontSize: '2rem' }}>
        {icon}
      </div>
      <div>
        <div style={{
          fontSize: '0.75rem',
          color: '#6b7280',
          marginBottom: '0.25rem',
          textTransform: 'uppercase',
          fontWeight: 'bold',
          letterSpacing: '0.05em'
        }}>
          {title}
        </div>
        <div style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#EAEBF2'
        }}>
          {value}
        </div>
      </div>
    </div>
  );
};
