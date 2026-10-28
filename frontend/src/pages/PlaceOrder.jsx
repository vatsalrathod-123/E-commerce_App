import React, { useContext, useState } from "react";
import Title from "../components/Title";
import CartTotal from "../components/CartTotal";
import { assets } from "../assets/assets";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";

// ------------------------ Validation ------------------------
const NAME_REGEX = /^[A-Za-z][A-Za-z\s.'-]*$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateField = (name, rawValue) => {
  const value = (rawValue || "").trim();

  switch (name) {
    case "firstName":
    case "lastName": {
      const label = name === "firstName" ? "First name" : "Last name";
      if (!value) return `${label} is required`;
      if (value.length < 2) return `${label} must be at least 2 characters`;
      if (!NAME_REGEX.test(value)) return `${label} can only contain letters`;
      return "";
    }
    case "email":
      if (!value) return "Email is required";
      if (!EMAIL_REGEX.test(value)) return "Enter a valid email address";
      return "";
    case "street":
      if (!value) return "Street is required";
      if (value.length < 5) return "Street must be at least 5 characters";
      return "";
    case "city":
    case "state":
    case "country": {
      const label = name.charAt(0).toUpperCase() + name.slice(1);
      if (!value) return `${label} is required`;
      if (!NAME_REGEX.test(value)) return `${label} can only contain letters`;
      return "";
    }
    case "zipcode":
      if (!value) return "Zipcode is required";
      if (!/^\d{6}$/.test(value)) return "Zipcode must be exactly 6 digits";
      return "";
    case "phone":
      if (!value) return "Phone number is required";
      if (!/^\d{10}$/.test(value))
        return "Phone number must be exactly 10 digits";
      return "";
    default:
      return "";
  }
};

// ------------------------ Reusable input with red error state ------------------------
const FormInput = ({ error, className = "", ...props }) => (
  <div className="flex flex-col w-full">
    <input
      {...props}
      className={`border rounded py-1.5 px-3.5 w-full outline-none ${
        error
          ? "border-red-500 text-red-500 placeholder-red-300"
          : "border-gray-300"
      } ${className}`}
    />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

const PlaceOrder = () => {
  const [method, setMethod] = useState("cod");
  const [issubmitting, setIsSubmitting] = useState(false);

  const {
    navigate,
    backendUrl,
    token,
    cartItems,
    setCartItems,
    getCartAmount,
    delivery_fee,
    products,
  } = useContext(ShopContext);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
    phone: "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const onChangeHandler = (event) => {
    const { name } = event.target;
    let { value } = event.target;

    // Zipcode & phone: digits only (keeps leading zeros, blocks letters and "e")
    if (name === "zipcode" || name === "phone") {
      value = value.replace(/\D/g, "");
    }

    setFormData((data) => ({ ...data, [name]: value }));

    // Once a field has been touched, keep its error message up to date while typing
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const onBlurHandler = (event) => {
    const { name, value } = event.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleMethodClick = (selected) => {
    if (selected === "razorpay") {
      toast.warning("Razorpay is unavailable during the testing period", {
        toastId: "razorpay-unavailable",
      });
      return;
    }
    setMethod(selected);
  };

  const initPay = (order) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Enter the Key ID generated from the Dashboard
      amount: order.amount, // Amount is in currency subunits. Default currency is INR.
      currency: order.currency,
      name: "Order Payment",
      description: "Order Payment",
      order_id: order.id,
      reciept: order.receipt,
      handler: async (response) => {
        console.log(response);
        try {
          const { data } = await axios.post(
            backendUrl + "/api/order/verifyrazorpay",
            response,
            { headers: { token } },
          );
          if (data.success) {
            navigate("/orders");
            setCartItems({});
          }
        } catch (error) {
          console.log(error);
          toast.error(error.message);
        }
      },
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    if (issubmitting) return;

    // ---- Validate all fields before placing the order ----
    const newErrors = {};
    const allTouched = {};
    Object.keys(formData).forEach((name) => {
      allTouched[name] = true;
      const message = validateField(name, formData[name]);
      if (message) newErrors[name] = message;
    });
    setTouched(allTouched);
    setErrors(newErrors);

    const firstInvalid = Object.keys(formData).find((name) => newErrors[name]);
    if (firstInvalid) {
      document.querySelector(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      let orderItems = [];

      for (const items in cartItems) {
        for (const item in cartItems[items]) {
          if (cartItems[items][item] > 0) {
            const itemInfo = structuredClone(
              products.find((product) => product._id === items),
            );
            if (itemInfo) {
              itemInfo.size = item;
              itemInfo.quantity = cartItems[items][item];
              orderItems.push(itemInfo);
            }
          }
        }
      }

      // Send trimmed address values
      const address = Object.fromEntries(
        Object.entries(formData).map(([key, value]) => [key, value.trim()]),
      );

      let orderData = {
        address,
        items: orderItems,
        amount: getCartAmount() + delivery_fee,
      };

      switch (method) {
        //Api call for COD
        case "cod": {
          const res = await axios.post(
            backendUrl + "/api/order/place",
            orderData,
            { headers: { token } },
          );
          if (res.data.success) {
            setCartItems({});
            navigate("/orders");
          } else {
            toast.error(res.data.message);
          }
          break;
        }

        //Api call for Stripe
        case "stripe": {
          const responseStripe = await axios.post(
            backendUrl + "/api/order/stripe",
            orderData,
            { headers: { token } },
          );

          if (responseStripe.data.success) {
            const { session_url } = responseStripe.data;
            window.location.replace(session_url);
          } else {
            toast.error(responseStripe.data.message);
          }
          break;
        }

        case "razorpay": {
          const responseRazorpay = await axios.post(
            backendUrl + "/api/order/razorpay",
            orderData,
            { headers: { token } },
          );
          if (responseRazorpay.data.success) {
            initPay(responseRazorpay.data.order);
          }
          break;
        }

        default:
          break;
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={onSubmitHandler}
      noValidate
      className="flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[80vh] border-t border-gray-200"
    >
      {/* ------------------------ Left Side ------------------------ */}
      <div className="flex flex-col gap-4 w-full sm:max-w-[480px]">
        <div className="text-xl sm:text-2xl my-3">
          <Title text1={"DELIVERY"} text2={"INFORMATION"} />
        </div>
        <div className="flex gap-3">
          <FormInput
            error={errors.firstName}
            onChange={onChangeHandler}
            onBlur={onBlurHandler}
            name="firstName"
            value={formData.firstName}
            type="text"
            placeholder="First name"
          />
          <FormInput
            error={errors.lastName}
            onChange={onChangeHandler}
            onBlur={onBlurHandler}
            name="lastName"
            value={formData.lastName}
            type="text"
            placeholder="Last name"
          />
        </div>
        <FormInput
          error={errors.email}
          onChange={onChangeHandler}
          onBlur={onBlurHandler}
          name="email"
          value={formData.email}
          type="email"
          placeholder="Email address"
        />
        <FormInput
          error={errors.street}
          onChange={onChangeHandler}
          onBlur={onBlurHandler}
          name="street"
          value={formData.street}
          type="text"
          placeholder="Street"
        />
        <div className="flex gap-3">
          <FormInput
            error={errors.city}
            onChange={onChangeHandler}
            onBlur={onBlurHandler}
            name="city"
            value={formData.city}
            type="text"
            placeholder="City"
          />
          <FormInput
            error={errors.state}
            onChange={onChangeHandler}
            onBlur={onBlurHandler}
            name="state"
            value={formData.state}
            type="text"
            placeholder="State"
          />
        </div>
        <div className="flex gap-3">
          <FormInput
            error={errors.zipcode}
            onChange={onChangeHandler}
            onBlur={onBlurHandler}
            name="zipcode"
            value={formData.zipcode}
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="Zipcode"
          />
          <FormInput
            error={errors.country}
            onChange={onChangeHandler}
            onBlur={onBlurHandler}
            name="country"
            value={formData.country}
            type="text"
            placeholder="Country"
          />
        </div>
        <FormInput
          error={errors.phone}
          onChange={onChangeHandler}
          onBlur={onBlurHandler}
          name="phone"
          value={formData.phone}
          type="tel"
          inputMode="numeric"
          maxLength={10}
          placeholder="Phone No"
        />
      </div>

      {/* ------------------------ Right Side ------------------------ */}
      <div className="mt-8">
        <div className="mt-8 min-w-80">
          <CartTotal />
        </div>
        <div className="mt-12">
          <Title text1={"PAYMENT"} text2={"METHOD"} />
          {/* --------------- Payment Method Selection ---------------- */}
          <div className="flex gap-3 flex-col lg:flex-row">
            <div
              onClick={() => handleMethodClick("stripe")}
              className="flex items-center gap-3 border border-gray-200 p-2 px-3 cursor-pointer"
            >
              <p
                className={`min-w-3.5 h-3.5 border border-gray-200 rounded-full ${
                  method === "stripe" ? "bg-green-400" : ""
                } `}
              ></p>
              <img className="h-5 mx-4" src={assets.stripe_logo} alt="" />
            </div>
            {/* Razorpay is paused during testing: shows a toast on click */}
            <div
              onClick={() => handleMethodClick("razorpay")}
              className="flex items-center gap-3 border border-gray-200 p-2 px-3 cursor-not-allowed opacity-50"
            >
              <p
                className={`min-w-3.5 h-3.5 border border-gray-200 rounded-full ${
                  method === "razorpay" ? "bg-green-400" : ""
                } `}
              ></p>
              <img className="h-5 mx-4" src={assets.razorpay_logo} alt="" />
            </div>
            <div
              onClick={() => handleMethodClick("cod")}
              className="flex items-center gap-3 border border-gray-200 p-2 px-3 cursor-pointer"
            >
              <p
                className={`min-w-3.5 h-3.5 border border-gray-200 rounded-full ${
                  method === "cod" ? "bg-green-400" : ""
                } `}
              ></p>
              <p className="text-gray-500 text-sm font-medium mx-4">
                CASH ON DELIVERY
              </p>
            </div>
          </div>
          <div className="w-full text-end mt-8">
            <button
              type="submit"
              disabled={issubmitting}
              className="bg-black text-white px-16 py-3 text-sm cursor-pointer"
            >
              {issubmitting ? "Placing Order..." : "PLACE ORDER"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;
