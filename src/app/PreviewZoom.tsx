import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type ZoomLevel = 'fit' | 'full' | 'double';

const LEVELS: Array<{ id: ZoomLevel; label: string; hint: string }> = [
  { id: 'fit', label: 'Fit', hint: 'Whole poster' },
  { id: 'full', label: '100%', hint: 'Actual size' },
  { id: 'double', label: '200%', hint: 'Zoom in' },
];

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Full-viewport proof view over the live preview. Renders the SAME SVG string
 * the pane shows (single source of truth — no re-render through the engine),
 * so what you proof is exactly what exports. Fit / 100% / 200% control the
 * displayed size; anything larger than the viewport simply scrolls.
 */
export function PreviewZoom({ svg, onClose }: { svg: string; onClose: () => void }) {
  const [level, setLevel] = useState<ZoomLevel>('fit');
  // Fit width is measured from the canvas so the whole poster is contained; the
  // SVG itself keeps aspect ratio via `width:100%; height:auto` on its viewBox.
  const [fitWidth, setFitWidth] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // The engine tags the SVG with its physical size (e.g. width="24in"); at the
  // CSS 96px-per-inch reference that is the poster's "100%" pixel width.
  const { fullPx, aspect } = useMemo(() => {
    const w = Number(svg.match(/width="([\d.]+)in"/)?.[1]);
    const h = Number(svg.match(/height="([\d.]+)in"/)?.[1]);
    const wIn = Number.isFinite(w) && w > 0 ? w : 24;
    const hIn = Number.isFinite(h) && h > 0 ? h : 36;
    return { fullPx: Math.round(wIn * 96), aspect: wIn / hIn };
  }, [svg]);

  // Measure the canvas to fit the poster inside it (both axes), re-running on
  // viewport resize. jsdom does no layout (clientWidth === 0) — the guard leaves
  // fitWidth at 0 there, which is harmless for tests.
  useLayoutEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const measure = () => {
      if (el.clientWidth === 0 || el.clientHeight === 0) return;
      const cs = getComputedStyle(el);
      const padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
      const padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
      const availW = Math.max(1, el.clientWidth - padX);
      const availH = Math.max(1, el.clientHeight - padY);
      const scale = Math.min(availW / fullPx, availH / (fullPx / aspect));
      setFitWidth(Math.max(1, Math.floor(fullPx * scale)));
    };
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [fullPx, aspect]);

  // Move focus into the dialog on open and lock background scroll while it lives.
  useEffect(() => {
    closeRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Close when the click starts on empty dim space (backdrop or the canvas
  // padding around the poster) — never when it starts on the poster or controls.
  const closeOnEmptyClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) onClose();
  };

  const width = level === 'fit' ? fitWidth : level === 'double' ? fullPx * 2 : fullPx;
  const docStyle = width > 0 ? { width: `${width}px` } : undefined;

  return createPortal(
    <div className="preview-zoom-backdrop" onMouseDown={closeOnEmptyClick}>
      <div
        ref={dialogRef}
        className="preview-zoom-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Full-size poster proof"
      >
        <div className="preview-zoom-bar">
          <strong className="preview-zoom-title">Poster proof</strong>
          <div className="preview-zoom-levels" role="group" aria-label="Zoom level">
            {LEVELS.map((l) => (
              <button
                key={l.id}
                type="button"
                className={`preview-zoom-level${level === l.id ? ' on' : ''}`}
                aria-pressed={level === l.id}
                title={l.hint}
                onClick={() => setLevel(l.id)}
              >
                {l.label}
              </button>
            ))}
          </div>
          <button
            ref={closeRef}
            type="button"
            className="preview-zoom-close"
            aria-label="Close proof view"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div
          ref={canvasRef}
          className={`preview-zoom-canvas ${level === 'fit' ? 'fit' : 'zoomed'}`}
          onMouseDown={closeOnEmptyClick}
        >
          {/* Same SVG markup as the pane; the engine already XML-escapes all
              user text and colors, so this is safe. */}
          <div
            className="preview-zoom-doc"
            style={docStyle}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
