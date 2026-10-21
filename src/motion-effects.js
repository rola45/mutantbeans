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

const listenCta = document.querySelector(".hero-listen");
const backToTop = document.getElementById("back-to-top");
const updateUiLanguage = () => {
  const english = document.documentElement.lang !== "es";
  if (listenCta) {
    listenCta.textContent = english ? listenCta.dataset.en : listenCta.dataset.es;
    listenCta.setAttribute(
      "aria-label",
      english ? "Listen to Mutant Beans on Spotify" : "Escuchar a Mutant Beans en Spotify",
    );
  }
  if (backToTop) {
    const label = english ? backToTop.dataset.enLabel : backToTop.dataset.esLabel;
    backToTop.setAttribute("aria-label", label);
    backToTop.title = label;
  }
};
updateUiLanguage();
document.querySelector("[data-language-toggle]")?.addEventListener("click", () => {
  requestAnimationFrame(updateUiLanguage);
});

const progressValue = document.getElementById("page-progress-value");
const navLinks = [...document.querySelectorAll('.navlinks a[href^="#"]')];
let scrollFramePending = false;
let backToTopVisible = false;

const renderScrollPosition = () => {
  scrollFramePending = false;
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollableHeight > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollableHeight)) : 0;
  if (progressValue) progressValue.style.transform = `scaleX(${progress})`;

  const shouldShow = window.scrollY > 640;
  if (!backToTop || shouldShow === backToTopVisible) return;
  backToTopVisible = shouldShow;

  if (reduceMotion.matches) {
    backToTop.hidden = !shouldShow;
    return;
  }

  if (shouldShow) {
    backToTop.hidden = false;
    animate(backToTop, {
      opacity: [0, 1],
      transform: ["scale(0.78)", "scale(1)"],
    }, {
      duration: 0.22,
      ease: [0.22, 1, 0.36, 1],
      onComplete: () => backToTop.style.removeProperty("transform"),
    });
  } else {
    animate(backToTop, {
      opacity: [1, 0],
      transform: ["scale(1)", "scale(0.78)"],
    }, {
      duration: 0.16,
      onComplete: () => {
        backToTop.style.removeProperty("transform");
        if (!backToTopVisible) backToTop.hidden = true;
      },
    });
  }
};

const scheduleScrollRender = () => {
  if (scrollFramePending) return;
  scrollFramePending = true;
  requestAnimationFrame(renderScrollPosition);
};
window.addEventListener("scroll", scheduleScrollRender, { passive: true });
window.addEventListener("resize", scheduleScrollRender, { passive: true });
backToTop?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: reduceMotion.matches ? "auto" : "smooth" });
});
scheduleScrollRender();

if ("IntersectionObserver" in window && navLinks.length) {
  const sectionIds = new Set(navLinks.map((link) => link.hash.slice(1)));
  const sections = [...document.querySelectorAll("main > section[id]")]
    .filter((section) => sectionIds.has(section.id));
  const sectionObserver = new IntersectionObserver((entries) => {
    const current = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!current) return;
    navLinks.forEach((link) => {
      if (link.hash === `#${current.target.id}`) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }, { rootMargin: "-22% 0px -62% 0px", threshold: [0, 0.1, 0.3, 0.5] });
  sections.forEach((section) => sectionObserver.observe(section));
}
