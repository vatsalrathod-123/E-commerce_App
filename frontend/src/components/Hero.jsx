import React from "react";
import { motion } from "framer-motion";
import { assets } from "../assets/assets";
import { fadeUp, slideLeft, lineGrow, stagger } from "../animations/variants";

const Hero = () => {
  return (
    <div className="flex flex-col sm:flex-row border border-gray-400 overflow-hidden">
      {/* Hero Left Side */}
      <motion.div
        className="w-full sm:w-1/2 flex items-center justify-center py-10 sm:py-0"
        initial="hidden"
        animate="show"
        variants={stagger(0.15, 0.2)}
      >
        <div className="text-[#414141]">
          <motion.div className="flex items-center gap-2" variants={slideLeft}>
            <motion.p
              className="w-8 md:w-11 h-[2px] bg-[#414141] origin-left"
              variants={lineGrow}
            />
            <p className="font-medium text-sm md:text-base">OUR BESTSELLERS</p>
          </motion.div>

          <motion.h1
            className="text-3xl sm:py-3 lg:text-5xl leading-relaxed prata-regular"
            variants={fadeUp}
          >
            Latest Arrivals
          </motion.h1>

          <motion.div className="flex items-center gap-2" variants={slideLeft}>
            <p className="font-semibold text-sm md:text-base">SHOP NOW</p>
            <motion.p
              className="w-8 md:w-11 h-[2px] bg-[#414141] origin-left"
              variants={lineGrow}
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Hero Right Side */}
      <motion.img
        src={assets.hero_img}
        className="w-full sm:w-1/2"
        alt="..."
        initial={{ opacity: 0, scale: 1.12 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
};

export default Hero;
