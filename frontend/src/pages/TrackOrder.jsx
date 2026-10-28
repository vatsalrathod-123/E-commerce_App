import React, { useContext, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";

// Order stages in the order they happen
const STAGES = [
  "Order Placed",
  "Packing",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

// Returns the index of the stage the order is currently at
const getCurrentStageIndex = (status) => {
  const index = STAGES.findIndex(
    (stage) => stage.toLowerCase() === (status || "").toLowerCase(),
  );
  return index === -1 ? 0 : index;
};

const TrackOrder = () => {
  const { orderId, itemIndex } = useParams();
  const { backendUrl, token, currency } = useContext(ShopContext);

  const [order, setOrder] = useState(null);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await axios.post(
          backendUrl + "/api/order/userorders",
          {},
          { headers: { token } },
        );
        if (response.data.success) {
          const foundOrder = response.data.orders.find(
            (o) => o._id === orderId,
          );
          if (foundOrder) {
            setOrder(foundOrder);
            setItem(foundOrder.items[Number(itemIndex)] || null);
          }
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    loadOrder();
  }, [token, orderId, itemIndex, backendUrl]);

  if (loading) {
    return <p className="py-20 text-center text-gray-500">Loading order...</p>;
  }

  if (!order || !item) {
    return (
      <div className="py-20 text-center text-gray-600">
        <p>We couldn't find this order.</p>
        <Link to="/orders" className="inline-block mt-4 underline">
          Back to My Orders
        </Link>
      </div>
    );
  }

  const currentIndex = getCurrentStageIndex(order.status);

  // Stage styles: green = completed, yellow = in progress, gray = pending
  const getDotClass = (index) => {
    if (index <= currentIndex) return "bg-green-500 border-green-500";
    if (index === currentIndex + 1) return "bg-yellow-400 border-yellow-400";
    return "bg-gray-300 border-gray-300";
  };

  const getTextClass = (index) => {
    if (index <= currentIndex) return "text-green-600 font-semibold";
    if (index === currentIndex + 1) return "text-yellow-600 font-semibold";
    return "text-gray-400";
  };

  return (
    <div className="border-t border-gray-200 pt-16 pb-10">
      <div className="text-2xl">
        <Title text1={"TRACK"} text2={"ORDER"} />
      </div>

      <div className="mt-8 flex flex-col md:flex-row gap-10 md:gap-16">
        {/* ------------------------ Left: Product details ------------------------ */}
        <div className="md:w-1/2 flex flex-col gap-4 text-gray-700">
          <div className="flex items-start gap-6">
            <img className="w-24 sm:w-28" src={item.image[0]} alt="" />
            <div className="text-sm sm:text-base">
              <p className="font-medium text-base sm:text-lg">{item.name}</p>
              <p className="mt-2">
                {currency}
                {item.price}
              </p>
              <p className="mt-1">Quantity: {item.quantity}</p>
              <p className="mt-1">Size: {item.size}</p>
            </div>
          </div>

          <div className="text-sm space-y-2 border-t border-gray-200 pt-4">
            {/* <p>
              Order ID: <span className="text-gray-400">{order._id}</span>
            </p> */}
            <p>
              Date:{" "}
              <span className="text-gray-400">
                {new Date(order.date).toDateString()}
              </span>
            </p>
            <p>
              Payment:{" "}
              <span className="text-gray-400">{order.paymentMethod}</span>
            </p>
            <p>
              Order Total:{" "}
              <span className="text-gray-400">
                {currency}
                {order.amount}
              </span>
            </p>
          </div>
        </div>

        {/* ------------------------ Right: Vertical stage tracker ------------------------ */}
        <div className="md:w-1/2">
          <div className="flex flex-col">
            {STAGES.map((stage, index) => {
              const isLast = index === STAGES.length - 1;
              // Line leaving a completed stage is green, otherwise gray
              const lineClass =
                index < currentIndex ? "bg-green-500" : "bg-gray-300";

              return (
                <div key={stage} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      className={`w-4 h-4 rounded-full border-2 ${getDotClass(
                        index,
                      )}`}
                    />
                    {!isLast && (
                      <span className={`w-0.5 flex-1 min-h-12 ${lineClass}`} />
                    )}
                  </div>
                  <div className={isLast ? "" : "pb-8"}>
                    <p
                      className={`text-sm sm:text-base ${getTextClass(index)}`}
                    >
                      {stage}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <Link
            to="/orders"
            className="inline-block mt-6 border border-gray-200 px-4 py-2 text-sm font-medium rounded-sm"
          >
            Back to My Orders
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;
