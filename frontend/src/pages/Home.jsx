import React from "react";
import { motion, MotionConfig, useScroll, useSpring } from "framer-motion";
import Hero from "../components/Hero";
import LatestCollection from "../components/LatestCollection";
import BestSeller from "../components/BestSeller";
import OurPolicy from "../components/OurPolicy";
import NewsletterBox from "../components/NewsletterBox";

const Home = () => {
  // Scroll progress bar at the top of the page
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        className="fixed top-0 left-0 right-0 h-[3px] bg-[#c586a5] origin-left z-50"
        style={{ scaleX: progress }}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <Hero />
        <LatestCollection />
        <BestSeller />
        <OurPolicy />
        <NewsletterBox />
      </motion.div>
    </MotionConfig>
  );
};

export default Home;
