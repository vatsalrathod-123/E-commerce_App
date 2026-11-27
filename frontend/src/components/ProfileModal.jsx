import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { ShopContext } from "../context/ShopContext";
import { VscClose } from "react-icons/vsc";

// Shows the logged-in user's details in a popup
const ProfileModal = ({ open, onClose }) => {
  const { backendUrl, token, currency } = useContext(ShopContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load the profile each time the popup opens
  useEffect(() => {
    if (!open) return;

    const loadProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await axios.post(
          backendUrl + "/api/user/profile",
          {},
          { headers: { token } },
        );
        if (data.success) {
          setProfile(data.profile);
        } else {
          setError(data.message);
        }
      } catch (err) {
        console.error("Error loading profile:", err);
        setError("Could not load your profile.");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [open, backendUrl, token]);

  // Close with the Escape key
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const rows = profile
    ? [
        { label: "Name", value: profile.name },
        { label: "Email", value: profile.email },
        { label: "Total orders", value: profile.totalOrders },
        { label: "Delivered orders", value: profile.deliveredOrders },
        { label: "Total spent", value: `${currency}${profile.totalSpent}` },
        { label: "Items in cart", value: profile.cartItems },
      ]
    : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white shadow-xl border-t-4 border-[#c586a5] p-6 sm:p-8"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">My profile</h3>
          <button
            onClick={onClose}
            className="flex items-center justify-center cursor-pointer text-gray-600"
            aria-label="Close profile"
          >
            <VscClose size={20} />
          </button>
        </div>

        <div className="mt-5">
          {loading && <p className="text-sm text-gray-500">Loading...</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}

          {!loading && !error && profile && (
            <dl className="divide-y divide-gray-200 text-sm">
              {rows.map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between gap-4 py-3"
                >
                  <dt className="text-gray-500">{row.label}</dt>
                  <dd className="text-gray-800 font-medium text-right break-all">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="border border-gray-300 text-gray-700 px-5 py-2 text-sm cursor-pointer hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
