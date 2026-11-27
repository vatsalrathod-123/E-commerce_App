import React, { useContext } from "react";
import { motion } from "framer-motion";
import { ShopContext } from "../context/ShopContext";
import { Link } from "react-router-dom";
import { cardVariants } from "../animations/variants";

const ProductItem = ({ id, image, name, price }) => {
  const { currency } = useContext(ShopContext);
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Link
        to={`/product/${id}`}
        className="text-gray-700 cursor-pointer block"
      >
        <div className="overflow-hidden">
          <img
            className="hover:scale-110 transition ease-in-out"
            src={image[0]}
            alt=""
          />
        </div>
        <p className="pt-3 pb-1 text-sm">{name}</p>
        <p className="text-sm font-medium">
          {currency}
          {price}
        </p>
      </Link>
    </motion.div>
  );
};

export default ProductItem;
