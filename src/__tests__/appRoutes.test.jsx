import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';

vi.mock('../lib/pdfUtils', () => ({
  inspectPdfFile: vi.fn().mockResolvedValue({ pageCount: 5, width: 595, height: 842, aspectRatio: 0.7 }),
  loadPdfDocument: vi.fn().mockResolvedValue({
    numPages: 3,
    getPage: vi.fn().mockResolvedValue({
      getViewport: () => ({ width: 595, height: 842 }),
      cleanup: vi.fn(),
    }),
    destroy: vi.fn().mockResolvedValue(undefined),
  }),
  renderPdfPageToUrl: vi.fn().mockResolvedValue('blob:mock-page-url'),
}));

describe('App Routing & Core Pages', () => {
  it('renders HomePage in English with Demo Mode story shelf', async () => {
    window.history.pushState({}, '', '/');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('The Lantern on the Harbour Wall')).toBeInTheDocument();
    });
    expect(screen.getAllByText('Teacher Portal').length).toBeGreaterThan(0);
    expect(document.body.textContent).not.toMatch(/[\u0600-\u06FF]/);
  });

  it('renders TeacherPage login gate on /admin', async () => {
    window.history.pushState({}, '', '/admin');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Teacher Portal \(Admin\)/)).toBeInTheDocument();
    });
    expect(document.body.textContent).not.toMatch(/[\u0600-\u06FF]/);
  });

  it('renders NotFoundPage on unknown routes', async () => {
    window.history.pushState({}, '', '/non-existent-route');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Page Not Found')).toBeInTheDocument();
    });
    expect(document.body.textContent).not.toMatch(/[\u0600-\u06FF]/);
  });
});
