import { animate } from "motion/mini";

export function initSectionMotion(reduceMotion) {
  if (reduceMotion.matches) return;
  const reveal = (targets, { amount = 0.14, delay = 0, distance = 26, direction = "Y" } = {}) => {
    const elements = typeof targets === "string"
      ? [...document.querySelectorAll(targets)]
      : [...targets];

    if (!elements.length) return;

    const play = (element, index = 0) => {
      if (reduceMotion.matches || element.matches(":focus-within")) return;
      animate(
        element,
        { opacity: [0.35, 1], translate: [direction === "X" ? `-${distance}px 0` : `0 ${distance}px`, "0 0"] },
        {
          duration: 0.78,
          delay: Math.min(delay * index, 0.24),
          ease: [0.22, 1, 0.36, 1],
          onComplete: () => element.style.removeProperty("translate"),
        },
      );
    };

    if (!("IntersectionObserver" in window)) {
      elements.forEach(play);
      return;
    }

    const positions = new Map(elements.map((element, index) => [element, index]));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        play(entry.target, positions.get(entry.target));
        observer.unobserve(entry.target);
      });
    }, { threshold: amount, rootMargin: "0px 0px -8% 0px" });

    elements.forEach((element) => observer.observe(element));
  };

  const intro = (element, transform, delay = 0) => {
    if (!element) return;
    animate(element, {
      opacity: [0, 1],
      transform: [transform, "none"],
    }, {
      duration: 1.05,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onComplete: () => element.style.removeProperty("transform"),
    });
  };

  intro(document.querySelector(".hero > div:first-child"), "translateX(-42px)");
  intro(document.querySelector(".hero-image"), "translate(42px, 28px) scale(0.9)", 0.12);

  document.querySelectorAll("main > .section").forEach((section) => {
    reveal(section.querySelectorAll(":scope > .wrap > .section-head"));
  });

  reveal(".members > .member", { delay: 0.12 });
  Promise.resolve(window.mutantContentReady).then(() => {
    reveal("#fechas .tour-poster", { direction: "X", distance: 20 });
    reveal(".tour-list > .tour-date", { delay: 0.06 });
  });
  reveal(".release-list > .release", { delay: 0.075 });
  reveal(".gallery-grid", { distance: 32 });
  reveal([document.querySelector(".story-mark"), document.querySelector(".story-text")].filter(Boolean));
  reveal([document.querySelector(".feature"), document.querySelector(".release-panel")].filter(Boolean));
}

