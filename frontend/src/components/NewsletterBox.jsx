import React from "react";
import { motion } from "framer-motion";
import { fadeUp, viewOnce } from "../animations/variants";

const NewsletterBox = () => {
  const onSubmitHandler = (event) => {
    event.preventDefault();
  };
  return (
    <motion.div
      className="text-center"
      initial="hidden"
      whileInView="show"
      viewport={viewOnce}
      variants={fadeUp}
    >
      <p className="text-2xl font-medium text-gray-800">
        Subscribe now & get 20% off
      </p>
      <p className="text-gray-400 mt-3">
        Join our mailing list for early access to new arrivals, exclusive offers
        and style updates.
      </p>
      <form
        onSubmit={onSubmitHandler}
        className="w-full sm:w-1/2 flex items-center gap-3 mx-auto my-6 border border-gray-300 pl-3 transition-colors duration-300 focus-within:border-black"
      >
        <input
          type="email"
          className="w-full sm:flex-1 outline-none"
          placeholder="Enter your email"
          required
        />
        <motion.button
          type="submit"
          className="bg-black text-white text-xs px-10 py-4"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          SUBSCRIBE
        </motion.button>
      </form>
    </motion.div>
  );
};

export default NewsletterBox;
