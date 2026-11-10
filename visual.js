/* Optional, one-shot motion: reading and navigation never depend on animation. */
(() => {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (preference.matches || !('IntersectionObserver' in window) || !Element.prototype.animate) return;
  const running = new Set();
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      if (preference.matches) continue;
      const animation = entry.target.animate(
        [{ opacity: 0.5, transform: 'translateY(14px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 460, easing: 'cubic-bezier(.22,1,.36,1)' }
      );
      running.add(animation);
      animation.finished.then(() => running.delete(animation), () => running.delete(animation));
    }
  }, { threshold: 0.12 });
  document.querySelectorAll('.visual-section-title, .visual-equipment, .process-steps>a, .visual-hero-image, .visual-diagram').forEach((element) => observer.observe(element));
  preference.addEventListener('change', (event) => {
    if (!event.matches) return;
    observer.disconnect();
    running.forEach((animation) => animation.cancel());
    running.clear();
  });
})();
