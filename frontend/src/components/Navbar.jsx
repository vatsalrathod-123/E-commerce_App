import React, { useContext, useEffect, useRef, useState } from "react";
import { assets } from "../assets/assets";
import { NavLink, Link } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import ProfileModal from "./ProfileModal";
import ConfirmModal from "./ConfirmModal";

const Navbar = () => {
  const [visible, setVisible] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const {
    setShowSearch,
    getCartCount,
    navigate,
    token,
    setToken,
    setCartItems,
  } = useContext(ShopContext);

  // Admin panel address (runs on port 5174 in development)
  const ADMIN_URL = import.meta.env.VITE_ADMIN_URL || "http://localhost:5174";

  // Close the account menu when clicking anywhere outside it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const logout = () => {
    navigate("/login");
    localStorage.removeItem("token");
    setToken("");
    setCartItems({});
  };

  return (
    <div className="flex items-center justify-between py-5 font-medium">
      {/* logo*/}
      <Link to="/">
        <img src={assets.logo} className="w-36" alt="..." />
      </Link>

      {/* nav items */}
      <ul className="hidden sm:flex gap-5 text-sm text-gray-700">
        <NavLink to="/" className="flex flex-col items-center gap-1">
          <p>HOME</p>
          <hr className="w-2/4 border-none h-[1.5px] bg-gray-700 hidden" />
        </NavLink>
        <NavLink to="/collection" className="flex flex-col items-center gap-1">
          <p>COLLECTION</p>
          <hr className="w-2/4 border-none h-[1.5px] bg-gray-700 hidden" />
        </NavLink>
        <NavLink to="/about" className="flex flex-col items-center gap-1">
          <p>ABOUT</p>
          <hr className="w-2/4 border-none h-[1.5px] bg-gray-700 hidden" />
        </NavLink>
        <NavLink to="/contact" className="flex flex-col items-center gap-1">
          <p>CONTACT</p>
          <hr className="w-2/4 border-none h-[1.5px] bg-gray-700 hidden" />
        </NavLink>
      </ul>

      {/* cart and login */}
      <div className="flex items-center gap-6">
        <a
          href={ADMIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-block border border-black px-3 py-1 text-xs font-medium hover:bg-black hover:text-white transition-colors"
        >
          ADMIN
        </a>
        <img
          onClick={() => setShowSearch(true)}
          src={assets.search_icon}
          className="w-5 cursor-pointer"
          alt="..."
        />
        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => {
              if (!token) {
                navigate("/login");
              } else {
                setProfileMenuOpen((open) => !open);
              }
            }}
            aria-label="Account menu"
            aria-expanded={profileMenuOpen}
            className="cursor-pointer flex items-center"
          >
            <img className="w-5" src={assets.profile_icon} alt="" />
          </button>

          {/* Account menu: opens on click, closes on selection or outside click */}
          {token && profileMenuOpen && (
            <div className="absolute right-0 top-full pt-3 z-40">
              <div className="flex flex-col gap-1 w-36 py-2 bg-slate-100 text-gray-600 rounded shadow-md">
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    setShowProfile(true);
                  }}
                  className="text-left px-4 py-2 hover:bg-slate-200 hover:text-black cursor-pointer"
                >
                  My profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate("/orders");
                  }}
                  className="text-left px-4 py-2 hover:bg-slate-200 hover:text-black cursor-pointer"
                >
                  Orders
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    setShowLogoutConfirm(true);
                  }}
                  className="text-left px-4 py-2 hover:bg-slate-200 hover:text-black cursor-pointer"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
        <Link to="/cart" className="relative">
          <img
            src={assets.cart_icon}
            className="w-5 min-w-5 cursor-pointer"
            alt="..."
          />
          <p className="absolute right-[-5px] bottom-[-5px] w-4 text-center leading-4 bg-black text-white aspect-square rounded-full text-[8px]">
            {getCartCount()}
          </p>
        </Link>
        <img
          onClick={() => setVisible(true)}
          src={assets.menu_icon}
          className="w-5 cursor-pointer sm:hidden"
          alt="..."
        />
      </div>
      {/* Slidebar Menu for small screens */}
      <div
        className={`absolute top-0 right-0 bottom-0 overflow-hidden bg-white transition-all ${
          visible ? "w-full " : "w-0"
        }`}
      >
        <div className="flex flex-col text-gray-600">
          <div
            onClick={() => setVisible(false)}
            className="flex items-center gap-4 p-3 cursor-pointer"
          >
            <img
              src={assets.dropdown_icon}
              className="h-4 rotate-180"
              alt="..."
            />
            <p>Back</p>
          </div>
          <NavLink
            onClick={() => setVisible(false)}
            className="py-2 pl-6 border"
            to="/"
          >
            HOME
          </NavLink>
          <NavLink
            onClick={() => setVisible(false)}
            className="py-2 pl-6 border"
            to="/collection"
          >
            COLLECTION
          </NavLink>
          <NavLink
            onClick={() => setVisible(false)}
            className="py-2 pl-6 border"
            to="/about"
          >
            ABOUT
          </NavLink>
          <NavLink
            onClick={() => setVisible(false)}
            className="py-2 pl-6 border"
            to="/contact"
          >
            CONTACT
          </NavLink>
          <a
            href={ADMIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setVisible(false)}
            className="py-2 pl-6 border"
          >
            ADMIN PANEL
          </a>
        </div>
      </div>

      {/* My profile popup */}
      <ProfileModal open={showProfile} onClose={() => setShowProfile(false)} />

      {/* Logout confirmation */}
      <ConfirmModal
        open={showLogoutConfirm}
        title="Log out?"
        message="You will need to log in again to view your orders and saved chats."
        confirmText="Yes, log out"
        cancelText="Stay logged in"
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logout();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
};

export default Navbar;