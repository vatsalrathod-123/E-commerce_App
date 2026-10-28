import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import { assets } from "../assets/assets";
import CartTotal from "../components/CartTotal";

const Cart = () => {
  const { products, currency, cartItems, updateQuantity, navigate } =
    useContext(ShopContext);

  const [cartData, setCartData] = useState([]);

  useEffect(() => {
    if (products.length > 0) {
      const tempData = [];
      for (const items in cartItems) {
        for (const item in cartItems[items]) {
          if (cartItems[items][item] > 0) {
            tempData.push({
              _id: items,
              size: item,
              quantity: cartItems[items][item],
            });
          }
        }
      }
      setCartData(tempData);
    }
  }, [cartItems, products]);

  const handleIncrement = (item) => {
    updateQuantity(item._id, item.size, item.quantity + 1);
  };

  const handleDecrement = (item) => {
    // Quantity can't go to zero or below; removing an item is done via the delete button
    if (item.quantity <= 1) {
      toast.error("Quantity can't be zero or less than it", {
        toastId: `min-qty-${item._id}-${item.size}`,
      });
      return;
    }
    updateQuantity(item._id, item.size, item.quantity - 1);
  };

  const handleCheckout = () => {
    if (cartData.length === 0) {
      toast.error("Please select at least 1 product", {
        toastId: "empty-cart-checkout",
      });
      return;
    }
    navigate("/place-order");
  };

  const handleDelete = (item, productName) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove "${productName}" (Size: ${item.size}) from your cart?`,
    );
    if (confirmed) {
      updateQuantity(item._id, item.size, 0);
    }
  };

  return (
    <div className="border-t border-gray-200 pt-14">
      <div className="text-2xl mb-3">
        <Title text1={"YOUR"} text2={"CART"} />
      </div>
      <div>
        {cartData.map((item, index) => {
          const productData = products.find(
            (product) => product._id === item._id,
          );
          if (!productData) return null;
          const isMinQuantity = item.quantity <= 1;
          return (
            <div
              key={index}
              className="py-4 border-t border-b border-gray-200 text-gray-700 grid grid-cols-[3fr_1.5fr_0.5fr] sm:grid-cols-[4fr_2fr_0.5fr] items-center gap-4"
            >
              <div className="flex items-start gap-6">
                <img
                  src={productData.image[0]}
                  alt=""
                  className="w-16 sm:w-20"
                />
                <div>
                  <p className="text-xs sm:text-lg font-medium">
                    {productData.name}
                  </p>
                  <div className="flex items-center gap-5 mt-2 ">
                    <p>
                      {currency}
                      {productData.price}
                    </p>
                    <p className="px-2 sm:px-3 sm:py-1 border border-gray-200 bg-slate-50">
                      {item.size}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                {/* aria-disabled (not disabled) so the click still fires and shows the toast */}
                <button
                  type="button"
                  onClick={() => handleDecrement(item)}
                  aria-disabled={isMinQuantity}
                  aria-label="Decrease quantity"
                  className={`w-7 h-7 flex items-center justify-center border border-gray-200 bg-white ${
                    isMinQuantity
                      ? "opacity-40 cursor-not-allowed"
                      : "hover:bg-gray-100 cursor-pointer"
                  }`}
                >
                  -
                </button>
                <input
                  type="text"
                  value={item.quantity}
                  disabled
                  readOnly
                  className="w-10 sm:w-12 text-center border border-gray-200 px-1 py-1 bg-gray-50 text-gray-700 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => handleIncrement(item)}
                  aria-label="Increase quantity"
                  className="w-7 h-7 flex items-center justify-center border border-gray-200 bg-white hover:bg-gray-100 cursor-pointer"
                >
                  +
                </button>
              </div>

              <img
                onClick={() => handleDelete(item, productData.name)}
                className="w-4 mr-4 sm:w-5 cursor-pointer"
                src={assets.bin_icon}
                alt="Remove item"
                title="Remove item"
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-end my-20">
        <div className="w-full sm:w-[450px]">
          <CartTotal />
          <div className="w-full text-end">
            <button
              onClick={handleCheckout}
              className="bg-black text-white text-sm my-8 px-8 py-3 cursor-pointer"
            >
              PROCEED TO CHECKOUT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
