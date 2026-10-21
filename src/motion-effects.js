import { animate } from "motion/mini";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (!reduceMotion.matches) {
  const reveal = (targets, { amount = 0.14, delay = 0 } = {}) => {
    const elements = typeof targets === "string"
      ? [...document.querySelectorAll(targets)]
      : [...targets];

    if (!elements.length) return;

    const play = (element, index = 0) => {
      animate(
        element,
        { opacity: [0, 1], transform: ["translateY(18px)", "translateY(0px)"] },
        {
          duration: 0.78,
          delay: delay * index,
          ease: [0.22, 1, 0.36, 1],
          onComplete: () => element.style.removeProperty("transform"),
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
  reveal(".tour-list > .tour-date", { delay: 0.09 });
  reveal(".release-list > .release", { delay: 0.075 });
  reveal(".gallery-grid > .gallery-tile", { delay: 0.1 });
  reveal([document.querySelector(".story-mark"), document.querySelector(".story-text")].filter(Boolean));
  reveal([document.querySelector(".feature"), document.querySelector(".release-panel")].filter(Boolean));
}
