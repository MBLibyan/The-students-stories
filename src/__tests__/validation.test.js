import { describe, expect, it } from 'vitest';
import {
  validatePdfFile,
  validateAudioFile,
  validateImageFile,
  validateQuestion,
  moveQuestion,
  normalizeQuestionPositions,
  formatTime,
} from '../lib/validation';
import { getWhatsAppShareUrl } from '../lib/shareUtils';
import { extractBucketAndPath } from '../lib/storageService';
import { resolveAuthEmail, formatUserDisplayName } from '../lib/authUtils';
import { translateSupabaseError } from '../lib/supabase';

describe('File and Question Validation', () => {
  it('validates PDF files properly', () => {
    const goodPdf = new File(['%PDF-1.4 content'], 'story.pdf', { type: 'application/pdf' });
    expect(validatePdfFile(goodPdf).valid).toBe(true);

    const badExt = new File(['hello'], 'story.txt', { type: 'text/plain' });
    expect(validatePdfFile(badExt).valid).toBe(false);

    const emptyPdf = new File([], 'empty.pdf', { type: 'application/pdf' });
    expect(validatePdfFile(emptyPdf).valid).toBe(false);
  });

  it('validates audio and cover files properly', () => {
    const mp3 = new File(['audio'], 'track.mp3', { type: 'audio/mpeg' });
    const m4a = new File(['audio'], 'voice.m4a', { type: 'audio/mp4' });
    const badAudio = new File(['doc'], 'doc.pdf', { type: 'application/pdf' });
    expect(validateAudioFile(mp3).valid).toBe(true);
    expect(validateAudioFile(m4a).valid).toBe(true);
    expect(validateAudioFile(badAudio).valid).toBe(false);

    const png = new File(['img'], 'cover.png', { type: 'image/png' });
    const badImg = new File(['txt'], 'notes.txt', { type: 'text/plain' });
    expect(validateImageFile(png).valid).toBe(true);
    expect(validateImageFile(badImg).valid).toBe(false);
  });

  it('validates multiple choice and inference questions', () => {
    const validInference = {
      type: 'inference',
      question: 'What does the lantern symbolize?',
      options: ['A', 'B', 'C', 'D'],
      correct_index: 2,
      explanation: 'Chapter III shows small boats rely on eye-level guidance.',
    };
    expect(validateQuestion(validInference, 0).valid).toBe(true);

    const missingOption = {
      type: 'multiple_choice',
      question: 'Who is Clara?',
      options: ['A', '', 'C', 'D'],
      correct_index: 0,
    };
    expect(validateQuestion(missingOption, 0).valid).toBe(false);
  });

  it('reorders questions cleanly and keeps sequential positions', () => {
    const list = [
      { id: '1', question: 'Q1', position: 0 },
      { id: '2', question: 'Q2', position: 1 },
      { id: '3', question: 'Q3', position: 2 },
    ];
    const movedDown = moveQuestion(list, 0, 1);
    expect(movedDown.map((q) => q.id)).toEqual(['2', '1', '3']);
    expect(movedDown.map((q) => q.position)).toEqual([0, 1, 2]);

    const boundary = moveQuestion(movedDown, 0, -1);
    expect(boundary.map((q) => q.id)).toEqual(['2', '1', '3']);

    const normalized = normalizeQuestionPositions([
      { id: 'x', position: 5 },
      { id: 'y', position: 9 },
    ]);
    expect(normalized.map((q) => q.position)).toEqual([0, 1]);
  });

  it('formats audio durations and builds share/storage helpers', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(75)).toBe('01:15');
    expect(formatTime(NaN)).toBe('00:00');

    const wa = getWhatsAppShareUrl({
      title: 'The Lantern',
      url: 'https://example.netlify.app/book/123',
    });
    expect(wa).toContain('https://wa.me/?text=');
    expect(wa).toContain(encodeURIComponent('https://example.netlify.app/book/123'));

    const parsed = extractBucketAndPath(
      'https://abc.supabase.co/storage/v1/object/public/story-pdfs/user-1/book-1/story.pdf'
    );
    expect(parsed).toEqual({
      bucket: 'story-pdfs',
      path: 'user-1/book-1/story.pdf',
    });
  });

  it('resolves admin usernames to internal Supabase emails and formats display names', () => {
    expect(resolveAuthEmail('admin')).toEqual({
      valid: true,
      email: 'admin@storybook.local',
      isUsername: true,
      error: null,
    });

    expect(resolveAuthEmail('  Prof.Smith_01  ')).toEqual({
      valid: true,
      email: 'prof.smith_01@storybook.local',
      isUsername: true,
      error: null,
    });

    expect(resolveAuthEmail('teacher@university.edu')).toEqual({
      valid: true,
      email: 'teacher@university.edu',
      isUsername: false,
      error: null,
    });

    expect(resolveAuthEmail('bad user').valid).toBe(false);
    expect(resolveAuthEmail('\u0623\u062f\u0645\u0646').valid).toBe(false);
    expect(resolveAuthEmail('').valid).toBe(false);

    expect(formatUserDisplayName({ email: 'admin@storybook.local' })).toBe('admin');
    expect(formatUserDisplayName({ email: 'teacher@university.edu' })).toBe(
      'teacher@university.edu'
    );
    expect(
      translateSupabaseError({ message: 'Invalid login credentials' })
    ).toBe('Incorrect username or password.');
  });
});
