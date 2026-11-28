import React, { useContext, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";
import { useLocation } from "react-router-dom";

const SearchBar = () => {
  const { search, setSearch, showSearch, setShowSearch } =
    useContext(ShopContext);
  const [visible, setVisible] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.includes("collection")) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [location]);

  const isOpen = showSearch && visible;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="search-bar"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden border-t border-b border-gray-200 bg-gray-50 text-center"
        >
          <motion.div
            initial={{ y: -12 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="py-0"
          >
            <div className="inline-flex items-center justify-center border border-gray-400 px-5 py-2 my-5 mx-3 rounded-full w-3/4 sm:w-1/2 transition-colors duration-300 focus-within:border-black">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 outline-none bg-inherit text-sm"
                type="text"
                placeholder="Search"
              />
              <motion.img
                src={assets.search_icon}
                className="w-4"
                alt=""
                whileHover={{ scale: 1.15 }}
              />
            </div>
            <motion.img
              onClick={() => setShowSearch(false)}
              src={assets.cross_icon}
              className="inline w-3 cursor-pointer mb-4"
              alt=""
              whileHover={{ rotate: 90, scale: 1.2 }}
              whileTap={{ scale: 0.85 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchBar;
