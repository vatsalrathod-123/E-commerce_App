import React, { useContext, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";

const ForgotPassword = () => {
  const { backendUrl, navigate } = useContext(ShopContext);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response = await axios.post(
        backendUrl + "/api/user/forgot-password",
        { email },
      );
      if (response.data.success) {
        setSent(true);
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
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
      className="flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800"
    >
      <div className="inline-flex items-center gap-2 mb-2 mt-10">
        <p className="prata-regular text-3xl">Forgot Password</p>
        <hr className="border-none h-[1.5px] w-8 bg-gray-800" />
      </div>

      {sent ? (
        <p className="text-sm text-gray-600 text-center">
          If that email is registered, a reset link has been sent. Check your
          inbox.
        </p>
      ) : (
        <>
          <p className="text-sm text-gray-500 text-center">
            Enter your account email and we'll send you a link to reset your
            password.
          </p>
          <input
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            type="email"
            className="w-full px-3 py-2 border border-gray-800"
            placeholder="Email"
            required
          />
          <button
            disabled={isSubmitting}
            className="bg-black text-white font-light px-8 py-2 mt-4 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? "Sending..." : "Send Reset Link"}
          </button>
        </>
      )}

      <p
        onClick={() => navigate("/login")}
        className="cursor-pointer text-sm mt-2"
      >
        Back to Login
      </p>
    </form>
  );
};

export default ForgotPassword;
