// Shared animation settings for the whole site
export const easeOutSoft = [0.22, 1, 0.36, 1];

export const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: easeOutSoft } },
};

export const slideLeft = {
  hidden: { opacity: 0, x: -40 },
  show: { opacity: 1, x: 0, transition: { duration: 0.7, ease: easeOutSoft } },
};

export const lineGrow = {
  hidden: { scaleX: 0 },
  show: { scaleX: 1, transition: { duration: 0.9, ease: easeOutSoft } },
};

export const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: easeOutSoft },
  },
};

// Children animate one after another
export const stagger = (gap = 0.1, delay = 0.1) => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
});

// Runs once, when the element first enters the screen
export const viewOnce = { once: true, amount: 0.2 };
