import { CheckCircle, AlertCircle, XCircle, Loader2, Info } from 'lucide-react';
import { useState } from 'react';

interface Props {
  qualityScore?: number;
  isLoading?: boolean;
  showDetails?: boolean;
  className?: string;
}

export function BeatQualityBadge({ qualityScore, isLoading, showDetails = false, className = '' }: Props) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (isLoading) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-700 text-slate-300 text-xs font-medium rounded-md ${className}`}>
        <Loader2 size={12} className="animate-spin" />
        Validating...
      </div>
    );
  }

  if (qualityScore === undefined) {
    return null;
  }

  const getQualityData = () => {
    if (qualityScore >= 85) {
      return {
        label: 'Excellent',
        color: 'bg-green-600 text-white',
        icon: CheckCircle,
        description: 'High-quality generation meeting all standards',
      };
    } else if (qualityScore >= 70) {
      return {
        label: 'Good',
        color: 'bg-blue-600 text-white',
        icon: CheckCircle,
        description: 'Quality generation with minor improvements possible',
      };
    } else if (qualityScore >= 50) {
      return {
        label: 'Fair',
        color: 'bg-yellow-600 text-white',
        icon: AlertCircle,
        description: 'Acceptable quality but reshoot recommended',
      };
    } else {
      return {
        label: 'Poor',
        color: 'bg-red-600 text-white',
        icon: XCircle,
        description: 'Quality below threshold, automatic retry initiated',
      };
    }
  };

  const { label, color, icon: Icon, description } = getQualityData();

  if (showDetails) {
    return (
      <div className={`bg-slate-800/50 border border-slate-700 rounded-lg p-3 ${className}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Icon size={16} className={qualityScore >= 70 ? 'text-green-500' : qualityScore >= 50 ? 'text-yellow-500' : 'text-red-500'} />
            <div>
              <div className="text-sm font-medium text-white">Quality Score: {qualityScore}/100</div>
              <div className="text-xs text-slate-400">{description}</div>
            </div>
          </div>
          <span className={`px-2 py-1 ${color} text-xs font-medium rounded-md`}>
            {label}
          </span>
        </div>

        <div className="mt-3">
          <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                qualityScore >= 70 ? 'bg-green-500' : qualityScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${qualityScore}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${color} text-xs font-medium rounded-md cursor-help ${className}`}
      >
        <Icon size={12} />
        {label} ({qualityScore})
      </button>

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
          <div className="bg-slate-900 text-white text-xs rounded-lg shadow-xl border border-slate-700 p-3 w-48">
            <div className="font-medium mb-1">Quality Score: {qualityScore}/100</div>
            <div className="text-slate-400">{description}</div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900 border-r border-b border-slate-700" />
          </div>
        </div>
      )}
    </div>
  );
}

interface QualityDetailsProps {
  validations: Array<{
    validation_type: string;
    passed: boolean;
    score: number;
    issues_found: string[];
    suggestions: string[];
  }>;
}

export function BeatQualityDetails({ validations }: QualityDetailsProps) {
  const getValidationIcon = (validationType: string) => {
    const icons: Record<string, any> = {
      product_presence: '📦',
      text_legibility: '📝',
      color_consistency: '🎨',
      scene_transition: '🎬',
      character_consistency: '👤',
      overall: '⭐',
    };
    return icons[validationType] || '✓';
  };

  const getValidationLabel = (validationType: string) => {
    const labels: Record<string, string> = {
      product_presence: 'Product Visibility',
      text_legibility: 'Text Readability',
      color_consistency: 'Color Consistency',
      scene_transition: 'Scene Transitions',
      character_consistency: 'Character Consistency',
      overall: 'Overall Quality',
    };
    return labels[validationType] || validationType;
  };

  if (!validations || validations.length === 0) {
    return (
      <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 text-center">
        <Info size={24} className="mx-auto text-slate-500 mb-2" />
        <p className="text-sm text-slate-400">No quality validation data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-white">Quality Validation Results</h4>

      {validations.map((validation, index) => (
        <div
          key={index}
          className="bg-slate-800/30 border border-slate-700 rounded-lg p-3"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getValidationIcon(validation.validation_type)}</span>
              <span className="text-sm font-medium text-white">
                {getValidationLabel(validation.validation_type)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">{validation.score}/100</span>
              {validation.passed ? (
                <CheckCircle size={16} className="text-green-500" />
              ) : (
                <XCircle size={16} className="text-red-500" />
              )}
            </div>
          </div>

          <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden mb-2">
            <div
              className={`h-full transition-all ${
                validation.score >= 70 ? 'bg-green-500' : validation.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${validation.score}%` }}
            />
          </div>

          {validation.issues_found && validation.issues_found.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-xs font-medium text-slate-400">Issues:</p>
              {validation.issues_found.map((issue, i) => (
                <p key={i} className="text-xs text-red-400 pl-2">• {issue}</p>
              ))}
            </div>
          )}

          {validation.suggestions && validation.suggestions.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-xs font-medium text-slate-400">Suggestions:</p>
              {validation.suggestions.map((suggestion, i) => (
                <p key={i} className="text-xs text-blue-400 pl-2">• {suggestion}</p>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
