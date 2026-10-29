/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext, useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";
import RelatedProducts from "../components/RelatedProducts";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const Product = () => {
  const { productId } = useParams();
  const { products, currency, addToCart, backendUrl } = useContext(ShopContext);
  const [productData, setProductData] = useState(false);
  const [image, setImage] = useState("");
  const [size, setSize] = useState("");

  // Virtual try-on state
  const [tryOnEnabled, setTryOnEnabled] = useState(false);
  const [showTryOn, setShowTryOn] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [tryOnResult, setTryOnResult] = useState("");
  const [generating, setGenerating] = useState(false);
  const fileInputRef = useRef(null);

  const fetchProductData = async () => {
    products.map((item) => {
      if (item._id === productId) {
        setProductData(item);
        setImage(item.image[0]);
        return null;
      }
    });
  };

  useEffect(() => {
    fetchProductData();
  }, [productId, products]);

  // Check whether the try-on feature is switched on
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { data } = await axios.get(backendUrl + "/api/tryon/status");
        setTryOnEnabled(Boolean(data.success && data.enabled));
      } catch (error) {
        setTryOnEnabled(false);
      }
    };
    checkStatus();
  }, [backendUrl]);

  // Clear the old result when the user switches to another product
  useEffect(() => {
    setTryOnResult("");
    setPhoto(null);
    setPhotoPreview("");
    setShowTryOn(false);
  }, [productId]);

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Only JPG, PNG or WEBP photos are allowed.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error("Photo must be 5 MB or smaller.");
      return;
    }

    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    setTryOnResult("");
  };

  // Removes the selected photo and any result so the user can start again
  const removePhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(null);
    setPhotoPreview("");
    setTryOnResult("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const generateTryOn = async () => {
    if (!photo) {
      toast.error("Please choose a photo first.");
      return;
    }
    setGenerating(true);
    setTryOnResult("");
    try {
      const formData = new FormData();
      formData.append("photo", photo);
      formData.append("productId", productId);

      // The free GPU takes about 7 minutes, so allow 13 minutes
      const { data } = await axios.post(backendUrl + "/api/tryon", formData, {
        timeout: 780000,
      });
      if (data.success) {
        setTryOnResult(data.image);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Try-on failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return productData ? (
    <div className="border-t-2 border-gray-200 pt-10 transition-opacity ease-in duration-500 opacity-100">
      {/* ------------------------ Product Data -------------------------- */}
      <div className="flex gap-12 sm:gap-12 flex-col sm:flex-row">
        {/* Product Images */}
        <div className="flex-1 flex flex-col-reverse gap-3 sm:flex-row">
          <div className="flex sm:flex-col overflow-x-auto sm:overflow-y-scroll justify-between sm:justify-normal sm:w-[18.7%] w-full">
            {productData.image.map((item, index) => (
              <img
                onClick={() => setImage(item)}
                src={item}
                key={index}
                className="w-[24%] sm:w-full sm:mb-3 flex-shrink-0 cursor-pointer"
                alt="..."
              />
            ))}
          </div>
          <div className="w-full sm:w-[80%]">
            <img className="w-full h-auto" src={image} alt="" />
          </div>
        </div>
        {/* ------------------------ Product Info -------------------------- */}
        <div className="flex-1">
          <h1 className="font-medium text-2xl mt-2">{productData.name}</h1>
          <div className="flex items-center gap-1 mt-2">
            <img src={assets.star_icon} alt="" className="w-3 5" />
            <img src={assets.star_icon} alt="" className="w-3 5" />
            <img src={assets.star_icon} alt="" className="w-3 5" />
            <img src={assets.star_icon} alt="" className="w-3 5" />
            <img src={assets.star_dull_icon} alt="" className="w-3 5" />
            <p className="pl-2">(122)</p>
          </div>
          <p className="mt-5 text-3xl font-medium">
            {currency}
            {productData.price}
          </p>
          <p className="mt-5 text-gray-500 md:w-4/5">
            {productData.description}
          </p>
          <div className="flex flex-col gap-4 my-8">
            <p> Select Size </p>
            <div className="flex gap-2">
              {productData.sizes.map((item, index) => (
                <button
                  onClick={() => setSize(item)}
                  className={`border border-gray-200 py-2 px-4 bg-gray-100 ${
                    item === size ? "border-orange-500" : ""
                  }`}
                  key={index}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => addToCart(productData._id, size)}
              className="bg-black text-white px-8 py-3 text-sm active:bg-gray-700 cursor-pointer"
            >
              ADD TO CART
            </button>
            {tryOnEnabled && (
              <button
                onClick={() => setShowTryOn((s) => !s)}
                className="border border-black text-black px-8 py-3 text-sm cursor-pointer hover:bg-gray-100"
              >
                {showTryOn ? "CLOSE TRY ON" : "TRY IT ON"}
              </button>
            )}
          </div>

          {/* ------------------------ Virtual Try-On -------------------------- */}
          {tryOnEnabled && showTryOn && (
            <div className="mt-6 border border-gray-200 p-4 flex flex-col gap-4 text-sm text-gray-600">
              <p className="font-medium text-black">Virtual try-on</p>
              <p className="text-xs text-gray-500">
                Upload a full-body photo of yourself (JPG, PNG or WEBP, max 5
                MB). Your photo is used only to create this preview and is not
                saved. Please upload only your own photo.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                className="text-sm"
              />

              {photoPreview && (
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <p className="mb-2 text-xs text-gray-500">Your photo</p>
                    <img
                      src={photoPreview}
                      alt="Your upload"
                      className="w-full max-h-96 object-contain bg-gray-50"
                    />
                  </div>
                  {tryOnResult && (
                    <div className="flex-1">
                      <p className="mb-2 text-xs text-gray-500">
                        Try-on result
                      </p>
                      <img
                        src={tryOnResult}
                        alt="Try-on result"
                        className="w-full max-h-96 object-contain bg-gray-50"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={generateTryOn}
                  disabled={!photo || generating}
                  className="bg-black text-white px-6 py-2 text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating
                    ? "Creating preview (about 7 minutes)..."
                    : "GENERATE PREVIEW"}
                </button>
                {photo && !generating && (
                  <button
                    onClick={removePhoto}
                    className="border border-gray-300 px-4 py-2 text-xs cursor-pointer hover:bg-gray-100"
                  >
                    Remove photo
                  </button>
                )}
              </div>
            </div>
          )}

          <hr className="mt-8 sm:w-4/5 border-gray-200" />
          <div className="text-sm text-gray-500 mt-5 flex flex-col gap-1">
            <p>100% Original product.</p>
            <p>Cash on delivery is available on this product.</p>
            <p>Easy return and exchange policy within 7 days.</p>
          </div>
        </div>
      </div>
      {/* ------------------------ Description & Review Section -------------------------- */}
      <div className="mt-20">
        <div className="flex">
          <b className="border border-gray-200 px-5 py-3 text-sm">
            {" "}
            Description{" "}
          </b>
          <p className="border border-gray-200 px-5 py-3 text-sm">
            {" "}
            Reviews (122){" "}
          </p>
        </div>
        <div className="flex flex-col gap-4 border border-gray-200 px-6 py-6 text-sm text-gray-500">
          <p>
            An e-commerce website is an online platform that facilitates the
            buying and selling of products or services over the internet. It
            serves as a virtual marketplace where businesses and individuals can
            showcase their products, interact with customers, and conduct
            transactions without the need for a physical presence. E-commerce
            websites have gained immense popularity due to their convenience,
            accessibility, and the global reach they offer.
          </p>
          <p>
            E-commerce websites typically display products or services along
            with detailed descriptions, images, prices, and any available
            variations (e.g., sizes, colors). Each product usually has its own
            dedicated page with relevant information.
          </p>
        </div>
      </div>

      {/* ------------------------ Related Products -------------------------- */}
      <RelatedProducts
        category={productData.category}
        subCategory={productData.subCategory}
      />
    </div>
  ) : (
    <div className="opacity-0"></div>
  );
};

export default Product;
