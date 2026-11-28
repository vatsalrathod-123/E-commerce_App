import React, { useContext, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";
import Title from "../components/Title";
import ProductItem from "../components/ProductItem";

const easeOutSoft = [0.22, 1, 0.36, 1];

const Collection = () => {
  const { products, search, showSearch } = useContext(ShopContext);
  const [showFilter, setShowFilter] = useState(false);
  const [filterProducts, setFilterProducts] = useState([]);
  const [category, setCategory] = useState([]);
  const [subCategory, setSubCategory] = useState([]);
  const [sortType, setSortType] = useState("relavent");

  const toggleCategory = (e) => {
    if (category.includes(e.target.value)) {
      setCategory((prev) => prev.filter((item) => item !== e.target.value));
    } else {
      setCategory((prev) => [...prev, e.target.value]);
    }
  };

  const toggleSubCategory = (e) => {
    if (subCategory.includes(e.target.value)) {
      setSubCategory((prev) => prev.filter((item) => item !== e.target.value));
    } else {
      setSubCategory((prev) => [...prev, e.target.value]);
    }
  };

  const applyFilter = () => {
    let productsCopy = products.slice();

    if (showSearch && search) {
      productsCopy = productsCopy.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (category.length > 0) {
      productsCopy = productsCopy.filter((item) =>
        category.includes(item.category),
      );
    }

    if (subCategory.length > 0) {
      productsCopy = productsCopy.filter((item) =>
        subCategory.includes(item.subCategory),
      );
    }
    setFilterProducts(productsCopy);
  };

  const sortProducts = () => {
    let fpCopy = filterProducts.slice();

    switch (sortType) {
      case "low-high":
        setFilterProducts(fpCopy.sort((a, b) => a.price - b.price));
        break;
      case "high-low":
        setFilterProducts(fpCopy.sort((a, b) => b.price - a.price));
        break;
      default:
        applyFilter();
    }
  };

  useEffect(() => {
    applyFilter();
  }, [category, subCategory, search, showSearch, products]);

  useEffect(() => {
    sortProducts();
  }, [sortType]);

  return (
    <motion.div
      className="flex flex-col sm:flex-row gap-1 sm:gap-10 pt-10 border-t border-gray-200"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Filter Options */}
      <motion.div
        className="min-w-60"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: easeOutSoft }}
      >
        <p
          onClick={() => setShowFilter(!showFilter)}
          className="my-2 text-xl flex items-center cursor-pointer gap-2"
        >
          FILTERS
          <motion.img
            src={assets.dropdown_icon}
            className="h-3 sm:hidden"
            alt=""
            animate={{ rotate: showFilter ? 90 : 0 }}
            transition={{ duration: 0.3, ease: easeOutSoft }}
          />
        </p>
        {/* Category Filter */}
        <div
          className={`border border-gray-300 pl-5 py-3 mt-6 ${
            showFilter ? "" : "hidden"
          } sm:block`}
        >
          <p className="mb-3 text-sm font-medium">CATEGORIES</p>
          <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
            <motion.p className="flex gap-2" whileHover={{ x: 3 }}>
              <input
                type="checkbox"
                className="w-3"
                value={"Men"}
                onChange={toggleCategory}
              />{" "}
              Men
            </motion.p>
            <motion.p className="flex gap-2" whileHover={{ x: 3 }}>
              <input
                type="checkbox"
                className="w-3"
                value={"Women"}
                onChange={toggleCategory}
              />{" "}
              Women
            </motion.p>
            <motion.p className="flex gap-2" whileHover={{ x: 3 }}>
              <input
                type="checkbox"
                className="w-3"
                value={"Kids"}
                onChange={toggleCategory}
              />{" "}
              kids
            </motion.p>
          </div>
        </div>
        {/* SubCategory Filter */}
        <div
          className={`border border-gray-300 pl-5 py-3 my-5 ${
            showFilter ? "" : "hidden"
          } sm:block`}
        >
          <p className="mb-3 text-sm font-medium">TYPE</p>
          <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
            <motion.p className="flex gap-2" whileHover={{ x: 3 }}>
              <input
                type="checkbox"
                className="w-3"
                value={"Topwear"}
                onChange={toggleSubCategory}
              />
              Topwear
            </motion.p>
            <motion.p className="flex gap-2" whileHover={{ x: 3 }}>
              <input
                type="checkbox"
                className="w-3"
                value={"Bottomwear"}
                onChange={toggleSubCategory}
              />
              Bottomwear
            </motion.p>
            <motion.p className="flex gap-2" whileHover={{ x: 3 }}>
              <input
                type="checkbox"
                className="w-3"
                value={"Winterwear"}
                onChange={toggleSubCategory}
              />
              Winterwear
            </motion.p>
          </div>
        </div>
      </motion.div>
      {/* Right side */}
      <div className="flex-1">
        <div className="flex justify-between text-base sm:text-2xl mb-4">
          <Title text1={"ALL"} text2={"COLLECTIONS"} />
          {/* Product sort */}
          <select
            onChange={(e) => setSortType(e.target.value)}
            className="border-2 border-gray-300 text-sm px-2 transition-colors duration-300 hover:border-black"
          >
            <option value="relavent">Sort by: Relavent</option>
            <option value="low-high">Sort by: Low to High</option>
            <option value="high-low">Sort by: High to Low</option>
          </select>
        </div>
        {/* Map Products: cards glide into place when filters change */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6">
          <AnimatePresence mode="popLayout">
            {filterProducts.map((item) => (
              <motion.div
                key={item._id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.35, ease: easeOutSoft }}
              >
                <ProductItem
                  name={item.name}
                  id={item._id}
                  price={item.price}
                  image={item.image}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default Collection;
