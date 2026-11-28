import React, { useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { assets } from "../assets/assets";
import { NavLink, Link } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import ProfileModal from "./ProfileModal";
import ConfirmModal from "./ConfirmModal";

const easeOutSoft = [0.22, 1, 0.36, 1];

// Mobile menu: links slide in one after another
const menuListVariants = {
  closed: {},
  open: { transition: { staggerChildren: 0.06, delayChildren: 0.12 } },
};
const menuLinkVariants = {
  closed: { opacity: 0, x: 20 },
  open: { opacity: 1, x: 0, transition: { duration: 0.35, ease: easeOutSoft } },
};

const Navbar = () => {
  const [visible, setVisible] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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

  const cartCount = getCartCount();

  // Add a shadow to the navbar once the page has been scrolled
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close the account menu when clicking anywhere outside it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
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
    // Sticky bar: stays at the top while scrolling. The negative margins and
    // matching padding let the white background cover the side gutters too.
    <div
      className={`sticky top-0 z-40 bg-white -mx-4 px-4 sm:-mx-[5vw] sm:px-[5vw] md:-mx-[7vw] md:px-[7vw] lg:-mx-[9vw] lg:px-[9vw] flex items-center justify-between py-5 font-medium transition-shadow duration-300 ${
        scrolled ? "shadow-md" : ""
      }`}
    >
      {/* logo*/}
      <Link to="/">
        <motion.img
          src={assets.logo}
          className="w-36"
          alt="..."
          whileHover={{ scale: 1.04 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        />
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
        <motion.a
          href={ADMIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-block border border-black px-3 py-1 text-xs font-medium hover:bg-black hover:text-white transition-colors"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.96 }}
        >
          ADMIN
        </motion.a>
        <motion.img
          onClick={() => setShowSearch(true)}
          src={assets.search_icon}
          className="w-5 cursor-pointer"
          alt="..."
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
        />
        <div className="relative" ref={profileMenuRef}>
          <motion.button
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
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <img className="w-5" src={assets.profile_icon} alt="" />
          </motion.button>

          {/* Account menu: opens on click, closes on selection or outside click */}
          <AnimatePresence>
            {token && profileMenuOpen && (
              <motion.div
                key="account-menu"
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.2, ease: easeOutSoft }}
                style={{ transformOrigin: "top right" }}
                className="absolute right-0 top-full pt-3 z-40"
              >
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <Link to="/cart" className="relative">
          <motion.img
            src={assets.cart_icon}
            className="w-5 min-w-5 cursor-pointer"
            alt="..."
            whileHover={{ scale: 1.15, rotate: -6 }}
            whileTap={{ scale: 0.9 }}
          />
          {/* The badge pops each time the count changes */}
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.p
              key={cartCount}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              className="absolute right-[-5px] bottom-[-5px] w-4 text-center leading-4 bg-black text-white aspect-square rounded-full text-[8px]"
            >
              {cartCount}
            </motion.p>
          </AnimatePresence>
        </Link>
        <motion.img
          onClick={() => setVisible(true)}
          src={assets.menu_icon}
          className="w-5 cursor-pointer sm:hidden"
          alt="..."
          whileTap={{ scale: 0.9 }}
        />
      </div>

      {/* Slidebar Menu for small screens (fixed so it covers the full screen height) */}
      <motion.div
        initial={false}
        animate={{ width: visible ? "100%" : 0 }}
        transition={{ duration: 0.45, ease: easeOutSoft }}
        className="fixed top-0 right-0 bottom-0 z-50 overflow-hidden bg-white"
      >
        <motion.div
          className="flex flex-col text-gray-600"
          variants={menuListVariants}
          initial="closed"
          animate={visible ? "open" : "closed"}
        >
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
          <motion.div variants={menuLinkVariants}>
            <NavLink
              onClick={() => setVisible(false)}
              className="block py-2 pl-6 border"
              to="/"
            >
              HOME
            </NavLink>
          </motion.div>
          <motion.div variants={menuLinkVariants}>
            <NavLink
              onClick={() => setVisible(false)}
              className="block py-2 pl-6 border"
              to="/collection"
            >
              COLLECTION
            </NavLink>
          </motion.div>
          <motion.div variants={menuLinkVariants}>
            <NavLink
              onClick={() => setVisible(false)}
              className="block py-2 pl-6 border"
              to="/about"
            >
              ABOUT
            </NavLink>
          </motion.div>
          <motion.div variants={menuLinkVariants}>
            <NavLink
              onClick={() => setVisible(false)}
              className="block py-2 pl-6 border"
              to="/contact"
            >
              CONTACT
            </NavLink>
          </motion.div>
          <motion.div variants={menuLinkVariants}>
            <a
              href={ADMIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setVisible(false)}
              className="block py-2 pl-6 border"
            >
              ADMIN PANEL
            </a>
          </motion.div>
        </motion.div>
      </motion.div>

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
