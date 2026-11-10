import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QuestionBuilder from '../components/QuestionBuilder';

function ControlledBuilder() {
  const [questions, setQuestions] = useState([]);
  return <QuestionBuilder questions={questions} onChange={setQuestions} />;
}

describe('QuestionBuilder', () => {
  it('adds, edits, reorders, and deletes questions including inference type', () => {
    render(<ControlledBuilder />);

    // Add Q1 (multiple_choice)
    fireEvent.change(screen.getByLabelText(/Question Text/), {
      target: { value: 'First question?' },
    });
    fireEvent.change(screen.getByLabelText('Option A'), { target: { value: 'Opt A1' } });
    fireEvent.change(screen.getByLabelText('Option B'), { target: { value: 'Opt B1' } });
    fireEvent.change(screen.getByLabelText('Option C'), { target: { value: 'Opt C1' } });
    fireEvent.change(screen.getByLabelText('Option D'), { target: { value: 'Opt D1' } });
    fireEvent.click(screen.getByRole('button', { name: /Add Question to List/ }));

    expect(screen.getByText('First question?')).toBeInTheDocument();
    expect(screen.getByText('1 Question')).toBeInTheDocument();

    // Add Q2 (inference)
    fireEvent.change(screen.getByLabelText(/Question Type/), {
      target: { value: 'inference' },
    });
    fireEvent.change(screen.getByLabelText(/Question Text/), {
      target: { value: 'Second inference question?' },
    });
    fireEvent.change(screen.getByLabelText('Option A'), { target: { value: 'Opt A2' } });
    fireEvent.change(screen.getByLabelText('Option B'), { target: { value: 'Opt B2' } });
    fireEvent.change(screen.getByLabelText('Option C'), { target: { value: 'Opt C2' } });
    fireEvent.change(screen.getByLabelText('Option D'), { target: { value: 'Opt D2' } });
    fireEvent.click(screen.getByRole('button', { name: /Add Question to List/ }));

    expect(screen.getByText('Second inference question?')).toBeInTheDocument();
    expect(screen.getByText('2 Questions')).toBeInTheDocument();

    // Reorder Q2 up so it becomes Q1
    const moveUpButtons = screen.getAllByRole('button', { name: 'Move up' });
    fireEvent.click(moveUpButtons[1]);
    const listItems = screen.getAllByRole('listitem');
    expect(listItems[0]).toHaveTextContent('Second inference question?');
    expect(listItems[1]).toHaveTextContent('First question?');

    // Edit first item
    const editButtons = screen.getAllByRole('button', { name: 'Edit question' });
    fireEvent.click(editButtons[0]);
    fireEvent.change(screen.getByLabelText(/Question Text/), {
      target: { value: 'Updated inference question?' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save Question Changes/ }));
    expect(screen.getByText('Updated inference question?')).toBeInTheDocument();

    // Delete first item
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete question' });
    fireEvent.click(deleteButtons[0]);
    expect(screen.queryByText('Updated inference question?')).not.toBeInTheDocument();
    expect(screen.getByText('1 Question')).toBeInTheDocument();
  });
});
