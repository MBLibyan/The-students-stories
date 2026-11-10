import { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  HelpCircle,
} from 'lucide-react';
import {
  validateQuestion,
  moveQuestion,
  normalizeQuestionPositions,
} from '../lib/validation';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

const EMPTY_DRAFT = {
  type: 'multiple_choice',
  question: '',
  options: ['', '', '', ''],
  correct_index: 0,
  explanation: '',
};

export default function QuestionBuilder({ questions, onChange }) {
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [editingIndex, setEditingIndex] = useState(null);
  const [formError, setFormError] = useState('');

  const handleOptionChange = (optIdx, value) => {
    setDraft((prev) => {
      const nextOpts = [...prev.options];
      nextOpts[optIdx] = value;
      return { ...prev, options: nextOpts };
    });
  };

  const resetDraft = () => {
    setDraft(EMPTY_DRAFT);
    setEditingIndex(null);
    setFormError('');
  };

  const handleSaveQuestion = () => {
    const check = validateQuestion(draft, editingIndex ?? questions.length);
    if (!check.valid) {
      setFormError(check.error);
      return;
    }

    setFormError('');
    const normalizedItem = {
      ...(editingIndex !== null ? questions[editingIndex] : {}),
      type: draft.type,
      question: draft.question.trim(),
      options: draft.options.map((o) => o.trim()),
      correct_index: Number(draft.correct_index),
      explanation: draft.explanation.trim(),
    };

    if (editingIndex !== null) {
      const next = questions.map((item, idx) =>
        idx === editingIndex ? normalizedItem : item
      );
      onChange(normalizeQuestionPositions(next));
    } else {
      onChange(normalizeQuestionPositions([...questions, normalizedItem]));
    }

    resetDraft();
  };

  const handleEdit = (idx) => {
    const target = questions[idx];
    setDraft({
      type: target.type || 'multiple_choice',
      question: target.question || '',
      options: Array.isArray(target.options) && target.options.length === 4
        ? [...target.options]
        : ['', '', '', ''],
      correct_index: Number(target.correct_index) || 0,
      explanation: target.explanation || '',
    });
    setEditingIndex(idx);
    setFormError('');
  };

  const handleDelete = (idx) => {
    const next = questions.filter((_, i) => i !== idx);
    onChange(normalizeQuestionPositions(next));
    if (editingIndex === idx) {
      resetDraft();
    } else if (editingIndex !== null && editingIndex > idx) {
      setEditingIndex(editingIndex - 1);
    }
  };

  const handleMove = (idx, direction) => {
    onChange(moveQuestion(questions, idx, direction));
    if (editingIndex === idx) {
      setEditingIndex(idx + direction);
    } else if (editingIndex === idx + direction) {
      setEditingIndex(idx);
    }
  };

  return (
    <div className="question-builder">
      <div className="qb-section-head">
        <div>
          <h3>
            <HelpCircle size={18} />
            <span>Quick Check Quiz Questions</span>
          </h3>
          <p className="muted">
            Add comprehension and inference questions to appear on the final quiz page before the back cover.
          </p>
        </div>
        <span className="count-badge">
          {questions.length} {questions.length === 1 ? 'Question' : 'Questions'}
        </span>
      </div>

      <div className="qb-form-card">
        <div className="qb-form-header">
          <strong>
            {editingIndex !== null
              ? `Edit Question #${editingIndex + 1}`
              : 'Add New Question'}
          </strong>
          {editingIndex !== null && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={resetDraft}>
              <X size={15} />
              <span>Cancel Edit</span>
            </button>
          )}
        </div>

        <div className="form-grid">
          <div className="field">
            <label htmlFor="q-type">Question Type</label>
            <select
              id="q-type"
              value={draft.type}
              onChange={(e) => setDraft((p) => ({ ...p, type: e.target.value }))}
            >
              <option value="multiple_choice">Multiple Choice</option>
              <option value="inference">Inference Question</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="q-text">Question Text</label>
            <textarea
              id="q-text"
              rows={2}
              placeholder="e.g., Why does the harbour-keeper keep the small brass lantern lit?"
              value={draft.question}
              onChange={(e) => setDraft((p) => ({ ...p, question: e.target.value }))}
            />
          </div>

          <div className="field">
            <span className="field-label">Four Answer Options (Select the correct answer)</span>
            <div className="qb-options-grid">
              {OPTION_LETTERS.map((letter, idx) => (
                <div
                  key={letter}
                  className={`qb-option-row ${draft.correct_index === idx ? 'is-correct-choice' : ''}`}
                >
                  <label className="qb-radio-label" title={`Mark option ${letter} as correct`}>
                    <input
                      type="radio"
                      name="correct-option-radio"
                      checked={draft.correct_index === idx}
                      onChange={() => setDraft((p) => ({ ...p, correct_index: idx }))}
                    />
                    <span className="qb-letter-badge">{letter}</span>
                  </label>
                  <input
                    type="text"
                    placeholder={`Option ${letter}`}
                    aria-label={`Option ${letter}`}
                    value={draft.options[idx]}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="field">
            <label htmlFor="q-explanation">Answer Explanation (Optional — shown after student answers)</label>
            <textarea
              id="q-explanation"
              rows={2}
              placeholder="Optional explanation referencing evidence from the story..."
              value={draft.explanation}
              onChange={(e) => setDraft((p) => ({ ...p, explanation: e.target.value }))}
            />
          </div>
        </div>

        {formError && (
          <div className="inline-alert error" role="alert">
            {formError}
          </div>
        )}

        <div className="qb-form-actions">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleSaveQuestion}
          >
            {editingIndex !== null ? <Check size={16} /> : <Plus size={16} />}
            <span>{editingIndex !== null ? 'Save Question Changes' : 'Add Question to List'}</span>
          </button>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="qb-empty">
          No questions added yet. Add questions above or save the book and add them later.
        </div>
      ) : (
        <ol className="qb-list">
          {questions.map((q, idx) => (
            <li
              key={q.id || `draft-q-${idx}`}
              className={`qb-item ${editingIndex === idx ? 'is-editing' : ''}`}
            >
              <div className="qb-item-content">
                <div className="qb-item-badges">
                  <span className="qb-pos-badge">Q{idx + 1}</span>
                  <span className={`quiz-type-badge ${q.type === 'inference' ? 'inference' : 'mc'}`}>
                    {q.type === 'inference' ? 'Inference' : 'Multiple Choice'}
                  </span>
                </div>
                <p className="qb-item-question">{q.question}</p>
                <div className="qb-item-answer">
                  Correct: <strong>{OPTION_LETTERS[q.correct_index]}</strong> — {q.options?.[q.correct_index]}
                </div>
              </div>

              <div className="qb-item-actions" aria-label={`Manage question ${idx + 1}`}>
                <button
                  type="button"
                  className="btn-icon"
                  disabled={idx === 0}
                  onClick={() => handleMove(idx, -1)}
                  title="Move up"
                  aria-label="Move up"
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  type="button"
                  className="btn-icon"
                  disabled={idx === questions.length - 1}
                  onClick={() => handleMove(idx, 1)}
                  title="Move down"
                  aria-label="Move down"
                >
                  <ArrowDown size={16} />
                </button>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => handleEdit(idx)}
                  title="Edit question"
                  aria-label="Edit question"
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  className="btn-icon danger"
                  onClick={() => handleDelete(idx)}
                  title="Delete question"
                  aria-label="Delete question"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
