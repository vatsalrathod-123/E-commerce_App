import React from "react";
import { motion } from "framer-motion";
import { useContext, useState, useEffect } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";
import ProductItem from "./ProductItem";
import { fadeUp, stagger, viewOnce } from "../animations/variants";

const BestSeller = () => {
  const { products } = useContext(ShopContext);
  const [bestseller, setBestseller] = useState([]);

  useEffect(() => {
    const bestProduct = products.filter((item) => item.bestseller);
    setBestseller(bestProduct.slice(0, 5));
  }, [products]);

  return (
    <div className="my-10">
      <div className="text-center text-3xl py-8">
        <Title text1={"BEST"} text2={"SELLERS"} />
        <motion.p
          className="w-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-600"
          initial="hidden"
          whileInView="show"
          viewport={viewOnce}
          variants={fadeUp}
        >
          Our most loved pieces, picked by thousands of happy customers.
          Discover the styles everyone keeps coming back for.
        </motion.p>
      </div>
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6"
        initial="hidden"
        whileInView="show"
        viewport={viewOnce}
        variants={stagger(0.08)}
      >
        {bestseller.map((item, index) => (
          <ProductItem
            key={index}
            id={item._id}
            image={item.image}
            name={item.name}
            price={item.price}
          />
        ))}
      </motion.div>
    </div>
  );
};

export default BestSeller;
