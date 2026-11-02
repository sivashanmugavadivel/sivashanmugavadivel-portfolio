import { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, Lock, LogOut, Menu, Pencil } from 'lucide-react';
import icon96 from '../assets/emergency-icon-96.png';
import icon144 from '../assets/emergency-icon-144.png';
import icon96Webp from '../assets/emergency-icon-96.webp';
import icon144Webp from '../assets/emergency-icon-144.webp';
import { usePrefersReducedMotion } from '../hooks';
import { firstName } from '../utils';

// What a split-flap tile flips through before it lands on its letter.
const FLAP_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const randomChar = () => FLAP_CHARS[Math.floor(Math.random() * FLAP_CHARS.length)];

/** Letters as people see them: a Tamil letter with its vowel sign is one tile, not two. */
function letters(text) {
  if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
    return [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].map((g) => g.segment);
  }
  // Older browsers: each letter with the marks that follow it.
  return text.match(/\P{M}\p{M}*/gu) ?? [];
}

/** Marks the board when the name is longer than the bar has room for (it then fades at the edge). */
function markCut(board) {
  board.classList.toggle('is-cut', board.scrollWidth > board.clientWidth + 1);
}

/**
 * role 'viewer': a responder's view with Lock (or Back, when `onBack` is given, for the owner's preview).
 * role 'owner': `title`, Edit, and a menu of `actions` ({ label, icon, onClick }) ending in Sign out.
 * The first name sits on split-flap tiles beside a heartbeat trace, with the name drifting in outline
 * behind; the bar slims down once the page scrolls.
 */
export default function TopBar({ name, role, title, onLock, onBack, onEdit, onSignOut, actions = [] }) {
  const reduced = usePrefersReducedMotion();
  const header = useRef(null);
  const board = useRef(null);
  const track = useRef(null);
  const [scrolled, setScrolled] = useState(false);
  const shownName = firstName(name || '');
  const menu = onSignOut ? [...actions, { label: 'Sign out', icon: LogOut, onClick: onSignOut }] : actions;
  const twoActions = role === 'owner' && Boolean(onEdit) && menu.length > 0;

  // Slimmer, and the name behind fading, once the page scrolls.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY || document.documentElement.scrollTop;
      header.current?.style.setProperty('--em-top-s', Math.min(y / 110, 1).toFixed(3));
      setScrolled(y > 12);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    frame = requestAnimationFrame(update);
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  // The name on split-flap tiles, each flipping through letters before it lands, later ones longer.
  useEffect(() => {
    const el = board.current;
    if (!el) return undefined;
    const timers = [];
    el.textContent = '';
    letters(shownName.toUpperCase()).forEach((ch, i) => {
      const tile = document.createElement('span');
      const face = document.createElement('span');
      face.className = 'em-top__ch';
      tile.appendChild(face);
      el.appendChild(tile);
      if (ch.trim() === '') {
        tile.className = 'em-top__tile em-top__tile--gap';
        return;
      }
      // Wider letters than A-Z, such as Tamil கௌ, get a tile as wide as they are.
      tile.className = /^[A-Z0-9]$/.test(ch) ? 'em-top__tile' : 'em-top__tile em-top__tile--wide';
      if (reduced) {
        face.textContent = ch;
        return;
      }
      let flips = 5 + i * 2 + Math.floor(Math.random() * 3);
      face.textContent = randomChar();
      const id = setInterval(() => {
        flips -= 1;
        face.textContent = flips <= 0 ? ch : randomChar();
        tile.classList.remove('is-tick');
        void tile.offsetWidth; // restarts the flip animation
        tile.classList.add('is-tick');
        if (flips <= 0) {
          clearInterval(id);
          tile.classList.add('is-land');
        }
      }, 65);
      timers.push(id);
    });
    markCut(el);
    return () => timers.forEach(clearInterval);
  }, [shownName, reduced]);

  // The bar's width changes with the screen and with scrolling (slimmer tiles).
  useEffect(() => {
    const el = board.current;
    if (!el || typeof ResizeObserver !== 'function') return undefined;
    const observer = new ResizeObserver(() => markCut(el));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // The outlined name drifting behind: two identical halves, each measured to be wider than the
  // screen, so the loop never shows a gap. Built again when the width or the font changes.
  useEffect(() => {
    const el = track.current;
    if (!el) return undefined;
    let frame = 0;
    let live = true;
    const build = () => {
      frame = 0;
      el.textContent = '';
      if (!shownName) return;
      const half = document.createElement('div');
      half.className = 'em-top__seg';
      el.appendChild(half);
      const wide = Math.max(window.innerWidth, window.screen?.width || 0, window.screen?.height || 0) + 160;
      for (let r = 0; r < 3 || (r < 80 && half.getBoundingClientRect().width < wide); r += 1) {
        const word = document.createElement('span');
        word.textContent = shownName;
        const cross = document.createElement('span');
        cross.className = 'em-top__x';
        half.append(word, cross);
      }
      el.appendChild(half.cloneNode(true));
    };
    const rebuild = () => {
      if (live && !frame) frame = requestAnimationFrame(build);
    };
    build();
    window.addEventListener('resize', rebuild);
    document.fonts?.ready.then(rebuild, () => {});
    return () => {
      live = false;
      window.removeEventListener('resize', rebuild);
      cancelAnimationFrame(frame);
    };
  }, [shownName]);

  // A mouse pointer near a button pulls it toward itself: the nearest one, within 120px.
  const buttons = () => [...(header.current?.querySelectorAll('.em-top__act') ?? [])];
  const release = (btn) => {
    delete btn.dataset.pulled;
    btn.style.translate = '';
  };
  const lean = (e) => {
    if (e.pointerType === 'touch' || reduced) return;
    let nearest = null;
    for (const btn of buttons()) {
      const r = btn.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const dist = Math.hypot(dx, dy);
      if (dist < 120 && (!nearest || dist < nearest.dist)) nearest = { btn, dx, dy, dist };
    }
    buttons()
      .filter((btn) => btn !== nearest?.btn)
      .forEach(release);
    if (!nearest) return;
    const f = 1 - nearest.dist / 160;
    nearest.btn.dataset.pulled = '';
    nearest.btn.style.translate = `${(nearest.dx * 0.35 * f).toFixed(1)}px ${(nearest.dy * 0.45 * f).toFixed(1)}px`;
  };
  const releaseAll = () => buttons().forEach(release);

  return (
    <header ref={header} className={`em-top${scrolled ? ' is-scrolled' : ''}`} onPointerMove={lean} onPointerLeave={releaseAll}>
      <div className="em-top__band">
        <div className="em-top__bg" aria-hidden="true">
          <div className="em-top__rise">
            <div ref={track} className="em-top__track" />
          </div>
        </div>
        <div className="em-top__row">
          <div className="em-top__title">
            <picture>
              <source type="image/webp" srcSet={`${icon96Webp} 2x, ${icon144Webp} 3x`} />
              <img className="em-top__icon" src={icon96} srcSet={`${icon96} 2x, ${icon144} 3x`} alt="" width="48" height="48" decoding="async" />
            </picture>
            <div className="em-top__stack">
              <p className="em-top__text">{role === 'owner' ? title || 'Your emergency page' : 'Emergency info for'}</p>
              <p className="em-top__line">
                <span className="em-sr-only em-top__name">{shownName}</span>
                <span ref={board} className="em-top__board" aria-hidden="true" />
                <span className="em-top__trace" aria-hidden="true">
                  <span className="em-top__ecg" />
                </span>
              </p>
            </div>
          </div>
          <div className={`em-top__actions${twoActions ? ' em-top__actions--two' : ''}`}>
            {role === 'owner' ? (
              <>
                {onEdit && (
                  <button type="button" className="em-top__act" onClick={onEdit}>
                    <Pencil aria-hidden="true" /> <span className="em-top__act-label">Edit</span>
                  </button>
                )}
                {menu.length > 0 && <TopMenu items={menu} />}
              </>
            ) : onBack ? (
              <button type="button" className="em-top__act em-top__act--back" onClick={onBack}>
                <ArrowLeft aria-hidden="true" /> Back
              </button>
            ) : (
              <button type="button" className="em-top__act" onClick={onLock}>
                <Lock aria-hidden="true" /> Lock
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

/** A disclosure list (not an ARIA menu): plain buttons, Tab to move, Escape or a tap outside to close. */
function TopMenu({ items }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef(null);
  const toggle = useRef(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const outside = (e) => {
      if (!wrap.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      toggle.current?.focus();
    };
    // focusin rather than blur: Safari doesn't focus a tapped button, so blur would close the
    // list before the tap on an item lands.
    document.addEventListener('pointerdown', outside);
    document.addEventListener('focusin', outside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('focusin', outside);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="em-menu" ref={wrap}>
      <button
        ref={toggle}
        type="button"
        className="em-top__act"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
      >
        <Menu aria-hidden="true" /> <span className="em-top__act-label">Menu</span>
      </button>
      <ul id={listId} className="em-menu__list" hidden={!open}>
        {items.map(({ label, icon: Icon, onClick }) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onClick();
              }}
            >
              {Icon && <Icon aria-hidden="true" />} {label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
