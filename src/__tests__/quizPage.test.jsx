import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QuizPage from '../components/QuizPage';

const SAMPLE_QUESTIONS = [
  {
    id: 'q1',
    type: 'multiple_choice',
    question: 'Where was the lantern hanging?',
    options: ['On the pier', 'On the roof', 'In the library', 'On a boat'],
    correct_index: 0,
    explanation: 'Chapter I places it halfway down the stone pier.',
    position: 0,
  },
  {
    id: 'q2',
    type: 'inference',
    question: 'Why did the keeper light the lantern?',
    options: [
      'To decorate the town',
      'To guide small rowboats below the bluff',
      'To replace the lighthouse',
      'To signal storms',
    ],
    correct_index: 1,
    explanation: 'The high lighthouse beam passes fifty feet overhead.',
    position: 1,
  },
];

describe('QuizPage', () => {
  it('shows friendly message when no questions exist', () => {
    render(<QuizPage questions={[]} bookTitle="Sample" />);
    expect(screen.getByText(/لم يضف المعلم أسئلة اختبار/)).toBeInTheDocument();
  });

  it('supports one-by-one mode with instant feedback, explanation, final score, and Try again', () => {
    render(<QuizPage questions={SAMPLE_QUESTIONS} bookTitle="The Lantern" />);

    expect(screen.getByText('Where was the lantern hanging?')).toBeInTheDocument();
    expect(screen.getByText('Multiple Choice')).toBeInTheDocument();

    // Pick wrong answer on Q1
    fireEvent.click(screen.getByRole('button', { name: /On the roof/ }));
    expect(screen.getByText(/Not quite — the correct answer is A/)).toBeInTheDocument();
    expect(screen.getByText('Chapter I places it halfway down the stone pier.')).toBeInTheDocument();

    // Go to Q2
    fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    expect(screen.getByText('Why did the keeper light the lantern?')).toBeInTheDocument();
    expect(screen.getByText('Inference')).toBeInTheDocument();

    // Pick correct answer on Q2
    fireEvent.click(screen.getByRole('button', { name: /To guide small rowboats below the bluff/ }));
    expect(screen.getByText(/Correct! Well reasoned\./)).toBeInTheDocument();

    // Open final score card
    fireEvent.click(screen.getByRole('button', { name: /See Final Score/ }));
    expect(screen.getByText('Quick Check Complete')).toBeInTheDocument();
    expect(screen.getByText(/1 \/ 2/)).toBeInTheDocument();
    expect(screen.getByText(/\(50%\)/)).toBeInTheDocument();

    // Reset with Try again
    fireEvent.click(screen.getByRole('button', { name: /Try again/ }));
    expect(screen.getByText('Where was the lantern hanging?')).toBeInTheDocument();
  });

  it('supports switching to All together mode and prevents flip propagation', () => {
    const parentMouseDown = vi.fn();
    const { container } = render(
      <div onMouseDown={parentMouseDown}>
        <QuizPage questions={SAMPLE_QUESTIONS} bookTitle="The Lantern" />
      </div>
    );

    const quizRoot = container.querySelector('.quiz-interactive-root');
    fireEvent.mouseDown(quizRoot);
    expect(parentMouseDown).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /All \(2\)/ }));
    expect(screen.getByText('Where was the lantern hanging?')).toBeInTheDocument();
    expect(screen.getByText('Why did the keeper light the lantern?')).toBeInTheDocument();
  });
});
