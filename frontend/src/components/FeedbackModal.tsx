// frontend/src/components/FeedbackModal.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { FiX, FiCheck, FiLock, FiAlertCircle } from 'react-icons/fi';
import { feedbackAPI } from '@/services/api';
import toast from 'react-hot-toast';

// ============================================================
// Validation thresholds — tune these if you want stricter/looser rules
// ============================================================
const RATING_MIN_ASPECTS = 3;    // min aspect stars required (Accuracy, Ease, ...)
const DETAILED_MIN_FIELDS = 3;   // min detailed text/choice fields required

interface FeedbackContext {
  assessment_1: any;
  assessment_2: any;
  comparison: any;
}

interface FeedbackModalProps {
  userId: number;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: () => void;
  inline?: boolean;
  blockCancel?: boolean;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  userId,
  isOpen,
  onClose,
  onSubmitted,
  inline = false,
  blockCancel = false,
}) => {
  const [mode, setMode] = useState<'rating' | 'detailed'>('rating');
  const [context, setContext] = useState<FeedbackContext | null>(null);
  const [loading, setLoading] = useState(false);

  // Track which tabs the user has visited (for UX hints)
  const [visitedRating, setVisitedRating] = useState(false);
  const [visitedDetailed, setVisitedDetailed] = useState(false);

  // Rating mode state
  const [overallRating, setOverallRating] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [ease, setEase] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [design, setDesign] = useState(0);
  const [value, setValue] = useState(0);
  const [positiveTags, setPositiveTags] = useState<string[]>([]);
  const [improvementTags, setImprovementTags] = useState<string[]>([]);

  // Detailed mode state
  const [overallExperience, setOverallExperience] = useState('');
  const [workedWell, setWorkedWell] = useState('');
  const [needsImprovement, setNeedsImprovement] = useState('');
  const [impactHealth, setImpactHealth] = useState('');
  const [impactMore, setImpactMore] = useState('');
  const [healthChange, setHealthChange] = useState('');
  const [changeMore, setChangeMore] = useState('');
  const [recommendOption, setRecommendOption] = useState('');
  const [recommendReason, setRecommendReason] = useState('');
  const [valuableLearned, setValuableLearned] = useState('');
  const [continueUsing, setContinueUsing] = useState('');

  // ============================================================
  // RESET STATE WHEN OPENED
  // ============================================================
  useEffect(() => {
    if (!isOpen) return;

    setMode('rating');
    setVisitedRating(false);
    setVisitedDetailed(false);
    setOverallRating(0);
    setAccuracy(0);
    setEase(0);
    setSpeed(0);
    setDesign(0);
    setValue(0);
    setPositiveTags([]);
    setImprovementTags([]);
    setOverallExperience('');
    setWorkedWell('');
    setNeedsImprovement('');
    setImpactHealth('');
    setImpactMore('');
    setHealthChange('');
    setChangeMore('');
    setRecommendOption('');
    setRecommendReason('');
    setValuableLearned('');
    setContinueUsing('');

    (async () => {
      try {
        const res = await feedbackAPI.getContext(userId);
        if (res.status === 'success') {
          setContext(res.data);
        }
      } catch (err) {
        console.error('Failed to load feedback context', err);
      }
    })();
  }, [isOpen, userId]);

  // ============================================================
  // VALIDATION — both tabs must be complete before submit
  // ============================================================
  const ratingAspectCount = [accuracy, ease, speed, design, value].filter(
    (n) => n > 0
  ).length;

  const ratingComplete =
    overallRating > 0 && ratingAspectCount >= RATING_MIN_ASPECTS;

  // Count "meaningful" detailed fields: either text with content or a selected choice
  const detailedFieldCount = [
    overallExperience.trim().length > 0,
    workedWell.trim().length > 0,
    needsImprovement.trim().length > 0,
    impactHealth.length > 0,
    healthChange.length > 0,
    recommendOption.length > 0,
    valuableLearned.trim().length > 0,
    continueUsing.length > 0,
  ].filter(Boolean).length;

  const detailedComplete = detailedFieldCount >= DETAILED_MIN_FIELDS;

  const canSubmit = ratingComplete && detailedComplete;

  // Live hint text
  const hintText = useMemo(() => {
    if (canSubmit) return '';
    const missing: string[] = [];
    if (!ratingComplete) {
      if (overallRating === 0) missing.push('overall star rating');
      if (ratingAspectCount < RATING_MIN_ASPECTS)
        missing.push(
          `at least ${RATING_MIN_ASPECTS} aspect ratings (${ratingAspectCount}/${RATING_MIN_ASPECTS})`
        );
    }
    if (!detailedComplete) {
      missing.push(
        `at least ${DETAILED_MIN_FIELDS} answers in the Detailed tab (${detailedFieldCount}/${DETAILED_MIN_FIELDS})`
      );
    }
    return `Still needed: ${missing.join(' • ')}`;
  }, [
    canSubmit,
    ratingComplete,
    detailedComplete,
    overallRating,
    ratingAspectCount,
    detailedFieldCount,
  ]);

  const toggleTag = (tag: string, isPositive: boolean) => {
    if (isPositive) {
      setPositiveTags((prev) =>
        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
      );
    } else {
      setImprovementTags((prev) =>
        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
      );
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast.error('Please complete both the Rating and Detailed tabs.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        overall_rating: overallRating || null,
        accuracy_rating: accuracy || null,
        ease_rating: ease || null,
        speed_rating: speed || null,
        design_rating: design || null,
        value_rating: value || null,
        overall_experience: overallExperience || null,
        worked_well: workedWell || null,
        needs_improvement: needsImprovement || null,
        impact_health: impactHealth || null,
        impact_more: impactMore || null,
        health_change: healthChange || null,
        change_more: changeMore || null,
        recommend_option: recommendOption || null,
        recommend_reason: recommendReason || null,
        valuable_learned: valuableLearned || null,
        continue_using: continueUsing || null,
        positive_tags: positiveTags,
        improvement_tags: improvementTags,
      };

      const res = await feedbackAPI.submit(userId, payload);
      if (res.status === 'success') {
        toast.success('Thank you! Your feedback has been saved.');
        onSubmitted();
        if (!inline) onClose();
      }
    } catch (err: any) {
      console.error('Feedback submit error', err);
      toast.error(err?.response?.data?.detail || 'Failed to submit feedback.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // ============================================================
  // STAR RENDERER
  // ============================================================
  const renderStars = (
    rating: number,
    setter: (v: number) => void,
    size = 'w-8 h-8'
  ) => (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => setter(n)}
          className="transition-transform transform hover:scale-110 active:scale-90"
        >
          <svg
            className={`${size} ${
              n <= rating ? 'text-amber-400' : 'text-slate-300'
            } transition-colors`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        </button>
      ))}
    </div>
  );

  // ============================================================
  // PILL BUTTON GROUP
  // ============================================================
  const renderChoiceGroup = (
    options: { v: string; l: string }[],
    selectedValue: string,
    onChange: (v: string) => void,
    accent: 'indigo' | 'emerald' | 'amber' | 'pink' = 'indigo'
  ) => {
    const palette = {
      indigo: {
        selected:
          'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20',
        unselected:
          'border-indigo-500/40 text-indigo-700 bg-indigo-50/40 hover:bg-indigo-100/60',
      },
      emerald: {
        selected:
          'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20',
        unselected:
          'border-emerald-500/40 text-emerald-700 bg-emerald-50/40 hover:bg-emerald-100/60',
      },
      amber: {
        selected:
          'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20',
        unselected:
          'border-amber-500/40 text-amber-700 bg-amber-50/40 hover:bg-amber-100/60',
      },
      pink: {
        selected:
          'bg-pink-600 text-white border-pink-600 shadow-md shadow-pink-500/20',
        unselected:
          'border-pink-500/40 text-pink-700 bg-pink-50/40 hover:bg-pink-100/60',
      },
    }[accent];

    return (
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isSelected = selectedValue === opt.v;
          return (
            <button
              key={opt.v}
              type="button"
              onClick={() => onChange(isSelected ? '' : opt.v)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 flex items-center gap-1.5 ${
                isSelected ? palette.selected : palette.unselected
              }`}
            >
              {isSelected && <FiCheck className="w-3 h-3" />}
              {opt.l}
            </button>
          );
        })}
      </div>
    );
  };

  // ============================================================
  // CONTENT
  // ============================================================
  const content = (
    <>
      {/* Header */}
      <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-slate-100 flex-shrink-0 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
              {blockCancel ? (
                <FiLock className="w-5 h-5 text-white" />
              ) : (
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2a10 10 0 0 0-7.54 16.58A6 6 0 0 1 10 14h4a6 6 0 0 1 5.54 4.58A10 10 0 0 0 12 2z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              )}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {blockCancel ? 'Feedback Required' : 'Share Your Feedback'}
              </h2>
              <p className="text-xs text-slate-500">
                {blockCancel
                  ? 'Submit feedback to unlock your next assessment'
                  : 'Unlock your next assessment'}
              </p>
            </div>
          </div>
          {!blockCancel && (
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
            >
              <FiX className="w-4 h-4 text-slate-500" />
            </button>
          )}
        </div>

        {/* Mode toggle with per-tab completion dots */}
        <div className="mt-4 flex justify-center">
          <div className="relative bg-slate-100 p-1 rounded-full flex items-center w-full max-w-[380px]">
            <div
              className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md transition-transform"
              style={{
                transform:
                  mode === 'detailed' ? 'translateX(100%)' : 'translateX(0%)',
              }}
            />
            <button
              type="button"
              onClick={() => {
                setMode('rating');
                setVisitedRating(true);
              }}
              className={`relative z-10 w-1/2 py-2 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 ${
                mode === 'rating' ? 'text-white' : 'text-slate-600'
              }`}
            >
              ⭐ Rating
              {ratingComplete && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px]">
                  <FiCheck className="w-2.5 h-2.5" />
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('detailed');
                setVisitedDetailed(true);
              }}
              className={`relative z-10 w-1/2 py-2 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 ${
                mode === 'detailed' ? 'text-white' : 'text-slate-600'
              }`}
            >
              💬 Detailed
              {detailedComplete && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px]">
                  <FiCheck className="w-2.5 h-2.5" />
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Progress hint */}
        <div className="mt-3 flex items-center justify-center gap-2 text-[11px]">
          <span
            className={
              ratingComplete
                ? 'text-emerald-600 font-semibold'
                : 'text-slate-500'
            }
          >
            {ratingComplete ? '✓' : '○'} Rating
          </span>
          <span className="text-slate-300">•</span>
          <span
            className={
              detailedComplete
                ? 'text-emerald-600 font-semibold'
                : 'text-slate-500'
            }
          >
            {detailedComplete ? '✓' : '○'} Detailed
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-6 space-y-6 bg-slate-50/40">
        {/* CONTEXT CARD */}
        {context?.comparison && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
            <h3 className="text-sm font-bold text-indigo-900 mb-2">
              📊 Your Recent Progress
            </h3>
            <p className="text-xs text-indigo-800 mb-3">
              These are your last 2 assessments this week. Your feedback helps
              us understand your experience with them.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-white rounded-lg p-2">
                <p className="text-slate-500">Brain Health</p>
                <p className="font-bold text-slate-800">
                  {context.assessment_1?.brain_health_score}
                  <span
                    className={`ml-1 text-[10px] ${
                      context.comparison.brain_health_change >= 0
                        ? 'text-emerald-600'
                        : 'text-red-600'
                    }`}
                  >
                    {context.comparison.brain_health_change >= 0 ? '+' : ''}
                    {context.comparison.brain_health_change}
                  </span>
                </p>
              </div>
              <div className="bg-white rounded-lg p-2">
                <p className="text-slate-500">Voice</p>
                <p className="font-bold text-slate-800">
                  {context.assessment_1?.voice_score}
                  <span
                    className={`ml-1 text-[10px] ${
                      context.comparison.voice_change >= 0
                        ? 'text-emerald-600'
                        : 'text-red-600'
                    }`}
                  >
                    {context.comparison.voice_change >= 0 ? '+' : ''}
                    {context.comparison.voice_change}
                  </span>
                </p>
              </div>
              <div className="bg-white rounded-lg p-2">
                <p className="text-slate-500">Memory</p>
                <p className="font-bold text-slate-800">
                  {context.assessment_1?.memory_score}
                  <span
                    className={`ml-1 text-[10px] ${
                      context.comparison.memory_change >= 0
                        ? 'text-emerald-600'
                        : 'text-red-600'
                    }`}
                  >
                    {context.comparison.memory_change >= 0 ? '+' : ''}
                    {context.comparison.memory_change}
                  </span>
                </p>
              </div>
              <div className="bg-white rounded-lg p-2">
                <p className="text-slate-500">Trend</p>
                <p className="font-bold text-slate-800 capitalize">
                  {context.comparison.overall_trend}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ---------- DETAILED MODE ---------- */}
        {mode === 'detailed' && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-800 block mb-2">
                💬 Overall Experience
              </label>
              <textarea
                value={overallExperience}
                onChange={(e) => setOverallExperience(e.target.value)}
                maxLength={500}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 resize-none"
                placeholder="Tell us about your experience..."
              />
              <p className="text-[11px] text-slate-400 text-right">
                {overallExperience.length}/500
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-800 block mb-2">
                🚀 What Worked Well
              </label>
              <textarea
                value={workedWell}
                onChange={(e) => setWorkedWell(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/30 resize-none"
                placeholder="What did you love about the app?"
              />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-800 block mb-2">
                🛠️ What Needs Improvement
              </label>
              <textarea
                value={needsImprovement}
                onChange={(e) => setNeedsImprovement(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/30 resize-none"
                placeholder="What could we do better?"
              />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                🌟 Impact On Your Health
              </label>
              <p className="text-xs text-slate-600">
                Has NeuroTwin AI helped you understand or improve your health?
              </p>
              {renderChoiceGroup(
                [
                  { v: 'significantly', l: 'Yes, significantly' },
                  { v: 'somewhat', l: 'Yes, somewhat' },
                  { v: 'not_sure', l: 'Not sure yet' },
                  { v: 'no', l: 'No, not really' },
                ],
                impactHealth,
                setImpactHealth,
                'emerald'
              )}
              <textarea
                value={impactMore}
                onChange={(e) => setImpactMore(e.target.value)}
                maxLength={300}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none"
                placeholder="Tell us more (optional)"
              />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                📊 Compared To Before
              </label>
              {renderChoiceGroup(
                [
                  { v: 'improved', l: 'Improved' },
                  { v: 'slightly_improved', l: 'Slightly improved' },
                  { v: 'no_change', l: 'No change' },
                  { v: 'worsened', l: 'Worsened' },
                ],
                healthChange,
                setHealthChange,
                'indigo'
              )}
              <textarea
                value={changeMore}
                onChange={(e) => setChangeMore(e.target.value)}
                rows={2}
                maxLength={300}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none"
                placeholder="What specifically changed? (optional)"
              />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                💡 Would You Recommend?
              </label>
              {renderChoiceGroup(
                [
                  { v: 'definitely_yes', l: 'Definitely yes' },
                  { v: 'probably_yes', l: 'Probably yes' },
                  { v: 'not_sure', l: 'Not sure' },
                  { v: 'probably_not', l: 'Probably not' },
                  { v: 'definitely_not', l: 'Definitely not' },
                ],
                recommendOption,
                setRecommendOption,
                'emerald'
              )}
              <textarea
                value={recommendReason}
                onChange={(e) => setRecommendReason(e.target.value)}
                rows={2}
                maxLength={200}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none"
                placeholder="Why? (optional)"
              />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-800 block mb-2">
                🔄 What Changed For You?
              </label>
              <p className="text-xs text-slate-600 mb-2">
                What's the most valuable thing you've learned about your health
                from this app?
              </p>
              <textarea
                value={valuableLearned}
                onChange={(e) => setValuableLearned(e.target.value)}
                rows={3}
                maxLength={500}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none"
                placeholder="Share your insights and reflections..."
              />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                🎯 Would You Continue?
              </label>
              {renderChoiceGroup(
                [
                  { v: 'yes_definitely', l: 'Yes, definitely' },
                  { v: 'yes_probably', l: 'Yes, probably' },
                  { v: 'not_sure', l: 'Not sure' },
                  { v: 'no_probably_not', l: 'No, probably not' },
                ],
                continueUsing,
                setContinueUsing,
                'indigo'
              )}
            </div>

            {/* Inline footer hint when detailed is incomplete */}
            {!detailedComplete && (
              <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <FiAlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  Please answer at least {DETAILED_MIN_FIELDS} questions in this
                  tab ({detailedFieldCount}/{DETAILED_MIN_FIELDS} done).
                </span>
              </div>
            )}
          </div>
        )}

        {/* ---------- RATING MODE ---------- */}
        {mode === 'rating' && (
          <div className="space-y-5">
            <div className="bg-indigo-50 rounded-2xl p-5 text-center">
              <p className="text-sm font-bold text-slate-800 mb-1">
                How was your experience?
              </p>
              <p className="text-xs text-slate-500 mb-3">
                Overall neurological monitoring & AI diagnostic accuracy
              </p>
              <div className="flex justify-center">
                {renderStars(overallRating, setOverallRating, 'w-9 h-9')}
              </div>
              {overallRating === 0 && (
                <p className="text-[11px] text-amber-600 mt-2">
                  ⚠️ Required — pick your overall rating
                </p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Rate each aspect
              </p>
              {[
                { label: 'Accuracy', value: accuracy, setter: setAccuracy },
                { label: 'Ease of Use', value: ease, setter: setEase },
                { label: 'Speed', value: speed, setter: setSpeed },
                { label: 'Design', value: design, setter: setDesign },
                { label: 'Value', value: value, setter: setValue },
              ].map((aspect) => (
                <div
                  key={aspect.label}
                  className="bg-white rounded-xl border border-slate-200 p-3 flex items-center justify-between"
                >
                  <span className="text-sm font-semibold text-slate-800">
                    {aspect.label}
                  </span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => aspect.setter(n)}
                      >
                        <svg
                          className={`w-5 h-5 ${
                            n <= aspect.value
                              ? 'text-amber-400'
                              : 'text-slate-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Quick Tags
              </p>
              <div>
                <p className="text-[11px] font-semibold text-emerald-700 mb-2">
                  What went great
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Accurate Results',
                    'Easy to Use',
                    'Fast Response',
                    'Beautiful Design',
                    'Helpful Insights',
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag, true)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        positiveTags.includes(tag)
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'border-emerald-500/40 text-emerald-700 bg-emerald-50/40'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-amber-700 mb-2">
                  Areas to improve
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Slow Loading', 'Confusing UI', 'Bugs Found'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag, false)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        improvementTags.includes(tag)
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'border-amber-500/40 text-amber-700 bg-amber-50/40'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Inline footer hint when rating is incomplete */}
            {!ratingComplete && (
              <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <FiAlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  {overallRating === 0
                    ? 'Please pick your overall star rating.'
                    : `Please rate at least ${RATING_MIN_ASPECTS} aspects (${ratingAspectCount}/${RATING_MIN_ASPECTS} done).`}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 sm:px-6 py-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-[11px] text-slate-500 flex-1 order-2 sm:order-1">
          {hintText && (
            <span className="flex items-start gap-1.5 text-amber-700">
              <FiAlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              {hintText}
            </span>
          )}
        </div>
        <div className="flex justify-end gap-3 order-1 sm:order-2">
          {!blockCancel ? (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs sm:text-sm font-semibold text-slate-700"
            >
              Cancel
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs sm:text-sm font-semibold text-slate-700"
            >
              Back to Dashboard
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !canSubmit}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-md transition-all ${
              canSubmit
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
            }`}
          >
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </div>
    </>
  );

  // ============================================================
  // INLINE MODE
  // ============================================================
  if (inline) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[85vh]">
          {content}
        </div>
      </div>
    );
  }

  // ============================================================
  // MODAL MODE
  // ============================================================
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-md"
        onClick={onClose}
      />
      <div
        className="relative z-10 w-full sm:max-w-[640px] h-full sm:h-auto sm:max-h-[90vh] bg-white sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {content}
      </div>
    </div>
  );
};

export default FeedbackModal;