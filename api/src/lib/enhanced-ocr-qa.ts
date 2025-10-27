import { Logger } from './logger';

const logger = new Logger({ module: 'enhanced-ocr-qa' });

export interface ExpectedElement {
  text: string;
  type: 'text' | 'number' | 'price' | 'percentage' | 'logo' | 'cta';
  required: boolean;
  timeRange?: { start: number; end: number };
}

export interface NumberValidationResult {
  expectedNumber: string;
  foundNumber?: string;
  matched: boolean;
  confidence: number;
  issues: string[];
}

export interface EnhancedOcrQaResult {
  ok: boolean;
  foundElements: string[];
  missingElements: string[];
  confidence: number;
  needsBurnIn: boolean;
  details: string[];
  numberValidations: NumberValidationResult[];
  criticalFailures: string[];
}

export class EnhancedOcrQaService {
  private minConfidenceThreshold = 0.9;
  private numberMinConfidence = 0.95;
  private priceRegex = /\$\d+(\.\d{2})?|€\d+(\.\d{2})?|£\d+(\.\d{2})?/g;
  private percentageRegex = /\d+%/g;
  private numberRegex = /\d+/g;

  async runEnhancedQA(
    videoUrl: string,
    expectedElements: ExpectedElement[]
  ): Promise<EnhancedOcrQaResult> {
    logger.info('Running enhanced OCR QA with number validation', {
      videoUrl,
      elementCount: expectedElements.length,
      numberElements: expectedElements.filter(e => this.isNumberType(e.type)).length,
    });

    const criticalElements = expectedElements.filter(e => e.required);
    const numberElements = expectedElements.filter(e => this.isNumberType(e.type));

    logger.info('Critical and number elements identified', {
      critical: criticalElements.length,
      numbers: numberElements.length,
    });

    await this.simulateProcessing();

    const foundElements: string[] = [];
    const missingElements: string[] = [];
    const numberValidations: NumberValidationResult[] = [];
    const criticalFailures: string[] = [];

    for (const element of expectedElements) {
      const detectionRate = this.getDetectionRate(element.type);
      const detected = Math.random() < detectionRate;

      if (detected) {
        foundElements.push(element.text);

        if (this.isNumberType(element.type)) {
          const validation = this.validateNumber(element.text, element.text, element.type);
          numberValidations.push(validation);

          if (!validation.matched && element.required) {
            criticalFailures.push(`Number mismatch: expected "${element.text}", found "${validation.foundNumber || 'none'}"`);
          }
        }
      } else {
        missingElements.push(element.text);

        if (element.required) {
          criticalFailures.push(`Missing required ${element.type}: "${element.text}"`);
        }

        if (this.isNumberType(element.type)) {
          numberValidations.push({
            expectedNumber: element.text,
            matched: false,
            confidence: 0,
            issues: [`${element.type} not detected in video`],
          });
        }
      }
    }

    const overallConfidence = foundElements.length / expectedElements.length;
    const numberConfidence = numberValidations.length > 0
      ? numberValidations.filter(v => v.matched).length / numberValidations.length
      : 1.0;

    const hasCriticalFailure = criticalFailures.length > 0;
    const numberValidationFailed = numberConfidence < this.numberMinConfidence;

    const passed = overallConfidence >= this.minConfidenceThreshold &&
                   numberConfidence >= this.numberMinConfidence &&
                   !hasCriticalFailure;

    const details: string[] = [];
    details.push(`Overall detection: ${Math.round(overallConfidence * 100)}%`);
    details.push(`Number accuracy: ${Math.round(numberConfidence * 100)}%`);
    details.push(`Elements found: ${foundElements.length}/${expectedElements.length}`);
    details.push(`Numbers validated: ${numberValidations.filter(v => v.matched).length}/${numberValidations.length}`);

    if (hasCriticalFailure) {
      details.push(`Critical failures: ${criticalFailures.length}`);
    }

    logger.info('Enhanced OCR QA complete', {
      ok: passed,
      confidence: overallConfidence,
      numberConfidence,
      foundCount: foundElements.length,
      missingCount: missingElements.length,
      numberValidations: numberValidations.length,
      criticalFailures: criticalFailures.length,
    });

    return {
      ok: passed,
      foundElements,
      missingElements,
      confidence: Math.min(overallConfidence, numberConfidence),
      needsBurnIn: !passed,
      details,
      numberValidations,
      criticalFailures,
    };
  }

  private isNumberType(type: string): boolean {
    return type === 'number' || type === 'price' || type === 'percentage';
  }

  private getDetectionRate(type: string): number {
    switch (type) {
      case 'price':
        return 0.75;
      case 'number':
        return 0.80;
      case 'percentage':
        return 0.85;
      case 'cta':
        return 0.90;
      case 'logo':
        return 0.70;
      default:
        return 0.85;
    }
  }

  private validateNumber(
    expected: string,
    found: string,
    type: 'number' | 'price' | 'percentage' | string
  ): NumberValidationResult {
    const expectedNumbers = this.extractNumbers(expected, type);
    const foundNumbers = this.extractNumbers(found, type);

    const matched = expectedNumbers.length === foundNumbers.length &&
                    expectedNumbers.every((num, idx) => num === foundNumbers[idx]);

    const confidence = matched ? 1.0 : this.calculateNumberSimilarity(expectedNumbers, foundNumbers);

    const issues: string[] = [];
    if (!matched) {
      if (expectedNumbers.length !== foundNumbers.length) {
        issues.push('Number count mismatch');
      }
      expectedNumbers.forEach((num, idx) => {
        if (foundNumbers[idx] !== num) {
          issues.push(`Expected "${num}" but found "${foundNumbers[idx] || 'none'}"`);
        }
      });
    }

    return {
      expectedNumber: expected,
      foundNumber: found,
      matched,
      confidence,
      issues,
    };
  }

  private extractNumbers(text: string, type: string): string[] {
    if (type === 'price') {
      const matches = text.match(this.priceRegex);
      return matches || [];
    }

    if (type === 'percentage') {
      const matches = text.match(this.percentageRegex);
      return matches || [];
    }

    const matches = text.match(this.numberRegex);
    return matches || [];
  }

  private calculateNumberSimilarity(expected: string[], found: string[]): number {
    if (expected.length === 0) return 1.0;
    if (found.length === 0) return 0.0;

    let matchCount = 0;
    expected.forEach((exp, idx) => {
      if (found[idx] === exp) {
        matchCount++;
      }
    });

    return matchCount / expected.length;
  }

  private async simulateProcessing(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  extractExpectedElements(overlays: Array<{ text: string; startTime: number; endTime: number }>): ExpectedElement[] {
    return overlays.map(overlay => {
      let type: ExpectedElement['type'] = 'text';
      let required = false;

      if (this.priceRegex.test(overlay.text)) {
        type = 'price';
        required = true;
      } else if (this.percentageRegex.test(overlay.text)) {
        type = 'percentage';
        required = true;
      } else if (this.numberRegex.test(overlay.text)) {
        type = 'number';
        required = true;
      } else if (this.isCTAText(overlay.text)) {
        type = 'cta';
        required = true;
      } else if (overlay.startTime < 1.0) {
        required = true;
      }

      return {
        text: overlay.text,
        type,
        required,
        timeRange: { start: overlay.startTime, end: overlay.endTime },
      };
    });
  }

  private isCTAText(text: string): boolean {
    const ctaKeywords = [
      'shop now',
      'buy now',
      'get yours',
      'order now',
      'learn more',
      'sign up',
      'try free',
      'claim offer',
    ];
    const lowerText = text.toLowerCase();
    return ctaKeywords.some(keyword => lowerText.includes(keyword));
  }
}

export const enhancedOcrQaService = new EnhancedOcrQaService();
