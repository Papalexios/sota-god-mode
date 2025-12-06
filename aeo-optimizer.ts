export interface AEOSnippet {
  type: 'featured' | 'paragraph' | 'list' | 'table' | 'faq';
  content: string;
  score: number;
  optimization: string;
}

export interface AEOOptimizationResult {
  snippets: AEOSnippet[];
  overallScore: number;
  recommendations: string[];
  optimizedContent: string;
}

export class AEOOptimizer {

  optimizeForAnswerEngines(
    content: string,
    primaryKeyword: string,
    faqSection?: Array<{ question: string; answer: string }>
  ): AEOOptimizationResult {
    const snippets: AEOSnippet[] = [];
    let optimizedContent = content;

    const directAnswer = this.createDirectAnswer(content, primaryKeyword);
    if (directAnswer) {
      snippets.push(directAnswer);
      optimizedContent = this.injectDirectAnswer(optimizedContent, directAnswer);
    }

    const listSnippet = this.createListSnippet(content);
    if (listSnippet) {
      snippets.push(listSnippet);
    }

    const tableSnippet = this.createTableSnippet(content);
    if (tableSnippet) {
      snippets.push(tableSnippet);
    }

    if (faqSection && faqSection.length > 0) {
      const faqSnippet = this.createFAQSnippet(faqSection);
      snippets.push(faqSnippet);
      optimizedContent = this.enhanceFAQMarkup(optimizedContent, faqSection);
    }

    const overallScore = this.calculateAEOScore(snippets);
    const recommendations = this.generateRecommendations(snippets, overallScore);

    return {
      snippets,
      overallScore,
      recommendations,
      optimizedContent
    };
  }

  private createDirectAnswer(content: string, keyword: string): AEOSnippet | null {
    const paragraphs = content.split('</p>').map(p => p.trim()).filter(p => p.length > 0);

    for (const para of paragraphs) {
      const cleanPara = para.replace(/<[^>]+>/g, '');

      if (
        cleanPara.length >= 40 &&
        cleanPara.length <= 300 &&
        cleanPara.toLowerCase().includes(keyword.toLowerCase())
      ) {
        const score = this.scoreParagraphForAEO(cleanPara, keyword);

        if (score >= 70) {
          return {
            type: 'paragraph',
            content: cleanPara,
            score,
            optimization: 'Direct answer optimized for AI Overview'
          };
        }
      }
    }

    return null;
  }

  private createListSnippet(content: string): AEOSnippet | null {
    const listMatches = content.match(/<(ul|ol)[^>]*>[\s\S]*?<\/(ul|ol)>/gi);

    if (listMatches && listMatches.length > 0) {
      const firstList = listMatches[0];
      const items = (firstList.match(/<li[^>]*>.*?<\/li>/gi) || []).length;

      if (items >= 3 && items <= 10) {
        return {
          type: 'list',
          content: firstList,
          score: 85,
          optimization: 'List format optimized for featured snippet'
        };
      }
    }

    return null;
  }

  private createTableSnippet(content: string): AEOSnippet | null {
    const tableMatches = content.match(/<table[^>]*>[\s\S]*?<\/table>/gi);

    if (tableMatches && tableMatches.length > 0) {
      const firstTable = tableMatches[0];
      const rows = (firstTable.match(/<tr[^>]*>/gi) || []).length;

      if (rows >= 3 && rows <= 8) {
        return {
          type: 'table',
          content: firstTable,
          score: 90,
          optimization: 'Table format optimized for comparison snippet'
        };
      }
    }

    return null;
  }

  private createFAQSnippet(
    faqSection: Array<{ question: string; answer: string }>
  ): AEOSnippet {
    const faqHtml = faqSection
      .slice(0, 5)
      .map(
        (faq) => `
          <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
            <h3 itemprop="name">${faq.question}</h3>
            <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
              <div itemprop="text">${faq.answer}</div>
            </div>
          </div>
        `
      )
      .join('');

    return {
      type: 'faq',
      content: faqHtml,
      score: 95,
      optimization: 'FAQ schema markup for voice search and AI overviews'
    };
  }

  private scoreParagraphForAEO(paragraph: string, keyword: string): number {
    let score = 50;

    if (paragraph.length >= 40 && paragraph.length <= 160) {
      score += 20;
    } else if (paragraph.length > 160 && paragraph.length <= 300) {
      score += 10;
    }

    if (paragraph.toLowerCase().includes(keyword.toLowerCase())) {
      score += 15;
    }

    const startsWithKeyword = paragraph.toLowerCase().startsWith(keyword.toLowerCase());
    if (startsWithKeyword) {
      score += 10;
    }

    const hasDefinitionPattern =
      /^(.*?is|are|means|refers to|can be defined as)/i.test(paragraph);
    if (hasDefinitionPattern) {
      score += 15;
    }

    const hasNumbersOrData = /\d+/.test(paragraph);
    if (hasNumbersOrData) {
      score += 5;
    }

    return Math.min(score, 100);
  }

  private injectDirectAnswer(content: string, answer: AEOSnippet): string {
    const firstParagraphMatch = content.match(/<p[^>]*>.*?<\/p>/i);

    if (firstParagraphMatch) {
      const directAnswerBox = `
        <div class="direct-answer" style="background: #f0f9ff; padding: 1.5rem; border-left: 4px solid #3b82f6; margin-bottom: 2rem; border-radius: 8px;">
          <h3 style="margin-top: 0; color: #1e40af; font-size: 1.125rem;">Quick Answer</h3>
          <p style="margin-bottom: 0; font-size: 1rem; line-height: 1.6;">${answer.content}</p>
        </div>
      `;

      return content.replace(firstParagraphMatch[0], directAnswerBox + firstParagraphMatch[0]);
    }

    return content;
  }

  private enhanceFAQMarkup(
    content: string,
    faqSection: Array<{ question: string; answer: string }>
  ): string {
    const faqHtml = `
      <div itemscope itemtype="https://schema.org/FAQPage" style="margin-top: 3rem;">
        <h2>Frequently Asked Questions</h2>
        ${faqSection
          .map(
            (faq) => `
            <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question" style="margin-bottom: 1.5rem;">
              <h3 itemprop="name" style="color: #1e40af; font-size: 1.125rem; margin-bottom: 0.5rem;">${faq.question}</h3>
              <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
                <div itemprop="text" style="color: #4b5563; line-height: 1.6;">${faq.answer}</div>
              </div>
            </div>
          `
          )
          .join('')}
      </div>
    `;

    return content + faqHtml;
  }

  private calculateAEOScore(snippets: AEOSnippet[]): number {
    if (snippets.length === 0) return 0;

    const totalScore = snippets.reduce((sum, snippet) => sum + snippet.score, 0);
    const avgScore = totalScore / snippets.length;

    let bonus = 0;
    if (snippets.some((s) => s.type === 'paragraph')) bonus += 10;
    if (snippets.some((s) => s.type === 'list')) bonus += 10;
    if (snippets.some((s) => s.type === 'table')) bonus += 10;
    if (snippets.some((s) => s.type === 'faq')) bonus += 15;

    return Math.min(avgScore + bonus, 100);
  }

  private generateRecommendations(snippets: AEOSnippet[], score: number): string[] {
    const recommendations: string[] = [];

    if (!snippets.some((s) => s.type === 'paragraph')) {
      recommendations.push(
        'Add a concise direct answer (40-160 characters) at the beginning of the content'
      );
    }

    if (!snippets.some((s) => s.type === 'list')) {
      recommendations.push('Include a bulleted or numbered list for better snippet capture');
    }

    if (!snippets.some((s) => s.type === 'table')) {
      recommendations.push(
        'Consider adding a comparison table for structured data presentation'
      );
    }

    if (!snippets.some((s) => s.type === 'faq')) {
      recommendations.push(
        'Add FAQ section with schema markup for voice search optimization'
      );
    }

    if (score < 70) {
      recommendations.push(
        'Improve content structure with clear headers and direct answers to common questions'
      );
    }

    return recommendations;
  }
}

export const globalAEOOptimizer = new AEOOptimizer();
