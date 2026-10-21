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
          duration: 0.52,
          delay: delay * index,
          ease: [0.22, 1, 0.36, 1],
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

  document.querySelectorAll("main > .section").forEach((section) => {
    reveal(section.querySelectorAll(":scope > .wrap > .section-head"));
  });

  reveal(".members > .member", { delay: 0.075 });
  reveal(".tour-list > .tour-date", { delay: 0.055 });
  reveal(".release-list > .release", { delay: 0.045 });
  reveal(".gallery-grid > .gallery-tile", { delay: 0.06 });
  reveal([document.querySelector(".story-mark"), document.querySelector(".story-text")].filter(Boolean));
  reveal([document.querySelector(".feature"), document.querySelector(".release-panel")].filter(Boolean));
}
