import React, { useState, useRef, useCallback } from 'react';
import { Lightbulb, X, BookOpen, MessageSquare, Zap, Star } from 'lucide-react';
import { explainKeyword } from '../lib/openai';

interface SelectableTextProps {
  text: string;
  onKeywordAdd: (keyword: string) => void;
  targetLanguage: string;
  className?: string;
  disabled?: boolean;
}

interface KeywordExplanation {
  explanation: string;
  usage_examples?: string[];
  grammar_notes?: string;
  similar_expressions?: string[];
}

export function SelectableText({ 
  text, 
  onKeywordAdd, 
  targetLanguage, 
  className = '', 
  disabled = false 
}: SelectableTextProps) {
  const [selectedText, setSelectedText] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [explanation, setExplanation] = useState<KeywordExplanation | null>(null);
  const [loading, setLoading] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  const handleTextSelection = useCallback(() => {
    if (disabled) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setShowTooltip(false);
      setSelectedText('');
      return;
    }

    const range = selection.getRangeAt(0);
    const selected = selection.toString().trim();

    if (selected.length === 0) {
      setShowTooltip(false);
      setSelectedText('');
      return;
    }

    // Check if selection is within our text element
    if (!textRef.current?.contains(range.commonAncestorContainer)) {
      return;
    }

    setSelectedText(selected);
    
    // Calculate tooltip position
    const rect = range.getBoundingClientRect();
    const containerRect = textRef.current.getBoundingClientRect();
    
    setTooltipPosition({
      x: rect.left + rect.width / 2 - containerRect.left,
      y: rect.top - containerRect.top - 10
    });
    
    setShowTooltip(true);
    setExplanation(null);
  }, [disabled]);

  const handleAddKeyword = async () => {
    if (!selectedText) return;

    // Add to keywords immediately
    onKeywordAdd(selectedText);
    
    // Get AI explanation
    setLoading(true);
    try {
      const result = await explainKeyword(selectedText, text, targetLanguage);
      setExplanation(result);
    } catch (error) {
      console.error('Failed to get explanation:', error);
      setExplanation({
        explanation: `"${selectedText}"에 대한 설명을 가져올 수 없습니다. 나중에 다시 시도해주세요.`,
        usage_examples: [text]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTooltip = () => {
    setShowTooltip(false);
    setSelectedText('');
    setExplanation(null);
    
    // Clear selection
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
  };

  return (
    <div className="relative">
      <div
        ref={textRef}
        className={`select-text cursor-text ${className} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        onMouseUp={handleTextSelection}
        onTouchEnd={handleTextSelection}
      >
        {text}
      </div>

      {/* Selection Tooltip */}
      {showTooltip && selectedText && (
        <div
          className="absolute z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-80 max-w-md"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translateX(-50%) translateY(-100%)'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <Lightbulb className="w-5 h-5 text-yellow-500 mr-2" />
              <h3 className="font-semibold text-gray-900">선택된 표현</h3>
            </div>
            <button
              onClick={handleCloseTooltip}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Selected Text */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <p className="font-medium text-blue-900">"{selectedText}"</p>
          </div>

          {/* Action Button */}
          {!explanation && (
            <button
              onClick={handleAddKeyword}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  AI 분석중...
                </>
              ) : (
                <>
                  <Star className="w-4 h-4 mr-2" />
                  키워드로 추가하고 AI 설명 받기
                </>
              )}
            </button>
          )}

          {/* AI Explanation */}
          {explanation && (
            <div className="space-y-4">
              {/* Main Explanation */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start">
                  <BookOpen className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-green-900 mb-2">AI 설명</h4>
                    <p className="text-green-800 text-sm leading-relaxed">{explanation.explanation}</p>
                  </div>
                </div>
              </div>

              {/* Usage Examples */}
              {explanation.usage_examples && explanation.usage_examples.length > 0 && (
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-start">
                    <MessageSquare className="w-5 h-5 text-purple-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-purple-900 mb-2">사용 예문</h4>
                      <div className="space-y-2">
                        {explanation.usage_examples.map((example, index) => (
                          <p key={index} className="text-purple-800 text-sm italic">
                            "{ example }"
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Grammar Notes */}
              {explanation.grammar_notes && (
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-start">
                    <Zap className="w-5 h-5 text-orange-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-orange-900 mb-2">문법 노트</h4>
                      <p className="text-orange-800 text-sm">{explanation.grammar_notes}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Similar Expressions */}
              {explanation.similar_expressions && explanation.similar_expressions.length > 0 && (
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <h4 className="font-semibold text-indigo-900 mb-2">유사한 표현</h4>
                  <div className="flex flex-wrap gap-2">
                    {explanation.similar_expressions.map((expr, index) => (
                      <span
                        key={index}
                        className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium"
                      >
                        {expr}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Success Message */}
              <div className="p-3 bg-green-100 rounded-lg border border-green-300">
                <p className="text-green-800 text-sm text-center font-medium">
                  ✅ "{selectedText}"가 키워드로 추가되었습니다!
                </p>
              </div>
            </div>
          )}

          {/* Tooltip Arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2">
            <div className="w-3 h-3 bg-white border-r border-b border-gray-200 transform rotate-45"></div>
          </div>
        </div>
      )}
    </div>
  );
}