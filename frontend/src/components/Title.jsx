import React from "react";
import { motion } from "framer-motion";
import { fadeUp, lineGrow, viewOnce } from "../animations/variants";

const Title = ({ text1, text2 }) => {
  return (
    <motion.div
      className="inline-flex gap-2 items-center mb-3"
      initial="hidden"
      whileInView="show"
      viewport={viewOnce}
      variants={fadeUp}
    >
      <p className="text-gray-500">
        {text1} <span className="text-gray-700 font-medium ">{text2}</span>
      </p>
      <motion.p
        className="w-8 sm:w-12 h-[1px] sm:h-[2px] bg-gray-700 origin-left"
        variants={lineGrow}
      />
    </motion.div>
  );
};

export default Title;
