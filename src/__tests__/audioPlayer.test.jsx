import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AudioPlayerBar from '../components/AudioPlayerBar';

describe('AudioPlayerBar', () => {
  it('shows notice when no audio URL is attached', () => {
    render(<AudioPlayerBar audioUrl={null} title="Story" />);
    expect(screen.getByText(/No audio narration is attached to this story yet/)).toBeInTheDocument();
  });

  it('renders play button, seek bar, and updates playbackRate for 0.75x / 1x / 1.25x', () => {
    const { container } = render(
      <AudioPlayerBar audioUrl="/demo/sample-audio.wav" title="The Lantern" />
    );

    const audioEl = container.querySelector('audio');
    expect(audioEl).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Play audio/ })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: /Seek audio position/ })).toBeInTheDocument();

    const btn075 = screen.getByRole('button', { name: '0.75x' });
    const btn1 = screen.getByRole('button', { name: '1x' });
    const btn125 = screen.getByRole('button', { name: '1.25x' });

    fireEvent.click(btn075);
    expect(audioEl.playbackRate).toBe(0.75);
    expect(btn075).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(btn125);
    expect(audioEl.playbackRate).toBe(1.25);
    expect(btn125).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(btn1);
    expect(audioEl.playbackRate).toBe(1);
    expect(btn1).toHaveAttribute('aria-pressed', 'true');
  });
});
