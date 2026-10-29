// Page enter and scroll reveal animations. Everything is skipped when the
// system asks for reduced motion.

const ENTER_SELECTOR = '.feature-main, .home, .VPDoc .vp-doc';
const REVEAL_SELECTOR = '.home-card, .ep-row';

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let observer: IntersectionObserver | null = null;

/** Fades the page content in after a route change. */
export function animatePageEnter() {
  if (prefersReducedMotion()) return;
  document
    .querySelector(ENTER_SELECTOR)
    ?.animate(
      [
        { opacity: 0, transform: 'translateY(10px)' },
        { opacity: 1, transform: 'none' },
      ],
      { duration: 380, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
    );
}

/** Cards slide in when scrolled into view, the ones in one row one after another. */
export function revealOnScroll() {
  observer?.disconnect();
  if (prefersReducedMotion()) return;

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer?.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -6% 0px' },
  );

  document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR).forEach((el) => {
    if (el.classList.contains('is-visible')) return;
    const index = el.parentElement ? Array.from(el.parentElement.children).indexOf(el) : 0;
    el.style.setProperty('--reveal-delay', `${Math.min(index, 5) * 70}ms`);
    el.classList.add('reveal');
    observer?.observe(el);
  });
}
