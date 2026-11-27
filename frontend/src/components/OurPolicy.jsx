import React from "react";
import { motion } from "framer-motion";
import { assets } from "../assets/assets";
import { fadeUp, stagger, viewOnce } from "../animations/variants";

const policies = [
  {
    icon: assets.exchange_icon,
    title: "Easy Exchange Policy",
    text: " We offer hassle free exchange policy ",
  },
  {
    icon: assets.quality_icon,
    title: "7 Days Return Policy",
    text: " We provide 7 days free return policy ",
  },
  {
    icon: assets.support_img,
    title: "Best customer support",
    text: " we provide 24/7 customer support ",
  },
];

const OurPolicy = () => {
  return (
    <motion.div
      className="flex flex-col sm:flex-row justify-around gap-12 sm:gap-2 text-center py-20 text-xs sm:text-sm md:text-base text-gray-700"
      initial="hidden"
      whileInView="show"
      viewport={viewOnce}
      variants={stagger(0.15)}
    >
      {policies.map((policy) => (
        <motion.div key={policy.title} variants={fadeUp}>
          <motion.img
            src={policy.icon}
            className="w-12 m-auto mb-5"
            alt=""
            whileHover={{ rotate: 8, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          />
          <p className="font-semibold">{policy.title}</p>
          <p className="text-gray-400">{policy.text}</p>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default OurPolicy;
