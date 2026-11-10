import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Award,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  SquareStack,
} from 'lucide-react';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export default function QuizPage({ questions = [], bookTitle = '' }) {
  const [viewMode, setViewMode] = useState('single'); // 'single' | 'all'
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionKey]: selectedOptionIndex }
  const [showSummaryInSingle, setShowSummaryInSingle] = useState(false);

  const total = questions.length;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = total > 0 && answeredCount === total;

  const stats = useMemo(() => {
    let correct = 0;
    let mcTotal = 0;
    let mcCorrect = 0;
    let infTotal = 0;
    let infCorrect = 0;

    questions.forEach((q, idx) => {
      const key = q.id || `q-${idx}`;
      const picked = answers[key];
      const isRight = picked !== undefined && Number(picked) === Number(q.correct_index);
      if (isRight) correct += 1;

      if (q.type === 'inference') {
        infTotal += 1;
        if (isRight) infCorrect += 1;
      } else {
        mcTotal += 1;
        if (isRight) mcCorrect += 1;
      }
    });

    const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
    return { correct, mcTotal, mcCorrect, infTotal, infCorrect, percent };
  }, [questions, answers]);

  const stopFlipPropagation = (e) => {
    e.stopPropagation();
  };

  const handleSelectOption = (questionKey, optionIdx) => {
    setAnswers((prev) => {
      if (prev[questionKey] !== undefined) return prev;
      return { ...prev, [questionKey]: optionIdx };
    });
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentIdx(0);
    setShowSummaryInSingle(false);
  };

  if (total === 0) {
    return (
      <div
        className="quiz-interactive-root"
        dir="ltr"
        lang="en"
        onMouseDown={stopFlipPropagation}
        onTouchStart={stopFlipPropagation}
        onPointerDown={stopFlipPropagation}
      >
        <div className="quiz-header">
          <div className="quiz-badge">
            <Sparkles size={15} />
            <span>Quick Check</span>
          </div>
          <h3>Story Comprehension Quiz</h3>
        </div>
        <div className="quiz-empty-state">
          <p>No quiz questions have been added for this story yet.</p>
          <p className="muted">Feel free to review the story pages and listen to the narration.</p>
        </div>
      </div>
    );
  }

  const renderQuestionCard = (q, idx) => {
    const key = q.id || `q-${idx}`;
    const selected = answers[key];
    const hasAnswered = selected !== undefined;
    const isCorrect = hasAnswered && Number(selected) === Number(q.correct_index);
    const isInference = q.type === 'inference';

    return (
      <div key={key} className="quiz-question-card">
        <div className="quiz-q-meta">
          <span className="quiz-q-number">
            Question {idx + 1} of {total}
          </span>
          <span className={`quiz-type-badge ${isInference ? 'inference' : 'mc'}`}>
            {isInference ? 'Inference' : 'Multiple Choice'}
          </span>
        </div>

        <p className="quiz-q-text">{q.question}</p>

        <div className="quiz-options-list" role="radiogroup" aria-label={`Question ${idx + 1}`}>
          {(q.options || []).map((optText, optIdx) => {
            const isPicked = selected === optIdx;
            const isRightOption = Number(q.correct_index) === optIdx;

            let stateClass = '';
            if (hasAnswered) {
              if (isRightOption) stateClass = 'is-correct';
              else if (isPicked) stateClass = 'is-wrong';
              else stateClass = 'is-dimmed';
            }

            return (
              <button
                key={optIdx}
                type="button"
                className={`quiz-option-btn ${stateClass} ${isPicked ? 'is-selected' : ''}`}
                onClick={() => handleSelectOption(key, optIdx)}
                disabled={hasAnswered}
                aria-pressed={isPicked}
              >
                <span className="quiz-opt-letter">{OPTION_LETTERS[optIdx]}</span>
                <span className="quiz-opt-label">{optText}</span>
                {hasAnswered && isRightOption && (
                  <CheckCircle2 size={18} className="quiz-opt-icon ok" aria-label="Correct" />
                )}
                {hasAnswered && isPicked && !isRightOption && (
                  <XCircle size={18} className="quiz-opt-icon bad" aria-label="Incorrect" />
                )}
              </button>
            );
          })}
        </div>

        {hasAnswered && (
          <div className={`quiz-feedback ${isCorrect ? 'feedback-ok' : 'feedback-bad'}`}>
            <strong>
              {isCorrect
                ? 'Correct! Well reasoned.'
                : `Not quite — the correct answer is ${OPTION_LETTERS[q.correct_index]}.`}
            </strong>
            {q.explanation && <p>{q.explanation}</p>}
          </div>
        )}
      </div>
    );
  };

  const renderScoreCard = () => {
    let remark = 'Keep reading carefully and try again!';
    if (stats.percent >= 85) remark = 'Outstanding literary comprehension!';
    else if (stats.percent >= 65) remark = 'Good grasp of the story and its details.';

    return (
      <div className="quiz-score-card" role="region" aria-label="Quiz Score">
        <div className="quiz-score-icon">
          <Award size={28} />
        </div>
        <h4>Quick Check Complete</h4>
        <div className="quiz-score-value">
          {stats.correct} / {total} <span>({stats.percent}%)</span>
        </div>
        <p className="quiz-score-remark">{remark}</p>

        {(stats.mcTotal > 0 || stats.infTotal > 0) && (
          <div className="quiz-score-breakdown">
            {stats.mcTotal > 0 && (
              <span>
                Multiple Choice: {stats.mcCorrect}/{stats.mcTotal}
              </span>
            )}
            {stats.infTotal > 0 && (
              <span>
                Inference: {stats.infCorrect}/{stats.infTotal}
              </span>
            )}
          </div>
        )}

        <button type="button" className="btn btn-primary btn-sm quiz-retry-btn" onClick={handleReset}>
          <RotateCcw size={16} />
          <span>Try again</span>
        </button>
      </div>
    );
  };

  const safeCurrentIdx = Math.min(currentIdx, total - 1);

  return (
    <div
      className="quiz-interactive-root"
      dir="ltr"
      lang="en"
      onMouseDown={stopFlipPropagation}
      onTouchStart={stopFlipPropagation}
      onPointerDown={stopFlipPropagation}
    >
      <div className="quiz-header">
        <div className="quiz-header-top">
          <div className="quiz-badge">
            <Sparkles size={14} />
            <span>Quick Check</span>
          </div>

          <div className="quiz-mode-switch" role="group" aria-label="Quiz display mode">
            <button
              type="button"
              className={`mode-chip ${viewMode === 'single' ? 'active' : ''}`}
              onClick={() => {
                setViewMode('single');
                setShowSummaryInSingle(false);
              }}
              title="Show one question at a time"
            >
              <SquareStack size={13} />
              <span>One by one</span>
            </button>
            <button
              type="button"
              className={`mode-chip ${viewMode === 'all' ? 'active' : ''}`}
              onClick={() => setViewMode('all')}
              title="Show all questions together"
            >
              <ListChecks size={13} />
              <span>All ({total})</span>
            </button>
          </div>
        </div>

        <h3>{bookTitle ? `${bookTitle} — Quick Check` : 'Story Quick Check'}</h3>
        <div className="quiz-progress-bar" aria-label={`Answered ${answeredCount} of ${total}`}>
          <div
            className="quiz-progress-fill"
            style={{ width: `${Math.round((answeredCount / total) * 100)}%` }}
          />
        </div>
      </div>

      <div className="quiz-scroll-body">
        {viewMode === 'single' ? (
          showSummaryInSingle && allAnswered ? (
            <div className="quiz-single-summary">
              {renderScoreCard()}
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowSummaryInSingle(false)}
              >
                Review answers
              </button>
            </div>
          ) : (
            <>
              {renderQuestionCard(questions[safeCurrentIdx], safeCurrentIdx)}

              <div className="quiz-single-nav">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  disabled={safeCurrentIdx === 0}
                  onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>

                {safeCurrentIdx < total - 1 ? (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setCurrentIdx((i) => Math.min(total - 1, i + 1))}
                  >
                    <span>Next</span>
                    <ChevronRight size={16} />
                  </button>
                ) : allAnswered ? (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowSummaryInSingle(true)}
                  >
                    <Award size={16} />
                    <span>See Final Score</span>
                  </button>
                ) : (
                  <span className="quiz-hint">Answer all questions to see your score</span>
                )}
              </div>

              {allAnswered && !showSummaryInSingle && (
                <div className="quiz-inline-score-banner">
                  <span>
                    Score: <strong>{stats.correct}/{total}</strong> ({stats.percent}%)
                  </span>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={handleReset}>
                    <RotateCcw size={14} />
                    <span>Try again</span>
                  </button>
                </div>
              )}
            </>
          )
        ) : (
          <div className="quiz-all-list">
            {questions.map((q, idx) => renderQuestionCard(q, idx))}
            {allAnswered ? (
              renderScoreCard()
            ) : (
              <div className="quiz-all-footer-note">
                Answer all {total} questions above to reveal your final score. ({answeredCount}/{total} answered)
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
