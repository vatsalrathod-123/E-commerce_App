import React, { useContext, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";
import ProductItem from "./ProductItem";
import { fadeUp, stagger, viewOnce } from "../animations/variants";

const LatestCollection = () => {
  const { products } = useContext(ShopContext);
  const [latestProducts, setLatestProducts] = useState([]);

  useEffect(() => {
    setLatestProducts(products.slice(0, 10));
  }, [products]);

  return (
    <div className="my-10 ">
      <div className="text-center py-8 text-3xl">
        <Title text1={"LATEST"} text2={"COLLECTIONS"} />
        <motion.p
          className="w-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-600"
          initial="hidden"
          whileInView="show"
          viewport={viewOnce}
          variants={fadeUp}
        >
          Fresh styles, just landed. Explore our newest arrivals across men's,
          women's and kids' fashion.
        </motion.p>
      </div>
      {/* Remdring Products */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6"
        initial="hidden"
        whileInView="show"
        viewport={viewOnce}
        variants={stagger(0.08)}
      >
        {latestProducts.map((item, index) => (
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

export default LatestCollection;
