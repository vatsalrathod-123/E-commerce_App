import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import productModel from "../models/productModel.js";

//fuction for add product
const addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      subCategory,
      sizes,
      bestseller,
    } = req.body;

    const image1 = req.files.image1 && req.files.image1[0];
    const image2 = req.files.image2 && req.files.image2[0];
    const image3 = req.files.image3 && req.files.image3[0];
    const image4 = req.files.image4 && req.files.image4[0];

    const images = [image1, image2, image3, image4].filter(
      (item) => item !== undefined,
    );

    // Upload all images at the same time to save time
    let imagesURL = await Promise.all(
      images.map(async (item) => {
        let result = await cloudinary.uploader.upload(item.path, {
          resource_type: "image",
        });
        return result.secure_url;
      }),
    );

    const productData = {
      name,
      description,
      category,
      price: Number(price),
      subCategory,
      bestseller: bestseller === "true" ? "true" : "false",
      sizes: JSON.parse(sizes),
      image: imagesURL,
      date: Date.now(),
    };

    const product = new productModel(productData);

    await product.save();

    res.json({ success: true, message: "Product Added" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//fuction for list product
const listProducts = async (req, res) => {
  try {
    const products = await productModel.find({});
    res.json({ success: true, products });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//fuction for removing product
// The product is removed from the database first and the response is sent right away.
// Images are deleted from Cloudinary afterwards, so the admin doesn't wait for them.
const removeProduct = async (req, res) => {
  try {
    const product = await productModel.findByIdAndDelete(req.body.id);

    if (!product) {
      return res.json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, message: "Product Removed" });

    Promise.all(
      product.image.map((imgUrl) => {
        const publicId = imgUrl.split("/").pop().split(".")[0];
        return cloudinary.uploader
          .destroy(publicId)
          .catch((error) =>
            console.log("Image cleanup failed:", error.message),
          );
      }),
    );
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//fuction for single product info
const singleProduct = async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await productModel.findById(productId);
    res.json({ success: true, product });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//fuction for updating product details (images are not changed here)
const updateProduct = async (req, res) => {
  try {
    const {
      id,
      name,
      description,
      price,
      category,
      subCategory,
      sizes,
      bestseller,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.json({ success: false, message: "Product not found" });
    }

    const cleanName = String(name || "").trim();
    const cleanDescription = String(description || "").trim();
    const priceNumber = Number(price);
    const sizeList = Array.isArray(sizes) ? sizes : [];

    if (cleanName.length < 3) {
      return res.json({
        success: false,
        message: "Product name must be at least 3 characters",
      });
    }
    if (cleanDescription.length < 10) {
      return res.json({
        success: false,
        message: "Description must be at least 10 characters",
      });
    }
    if (
      !Number.isInteger(priceNumber) ||
      priceNumber < 1 ||
      priceNumber > 9999
    ) {
      return res.json({
        success: false,
        message: "Price must be a whole number from 1 to 9999",
      });
    }
    if (sizeList.length === 0) {
      return res.json({ success: false, message: "Select at least one size" });
    }

    const product = await productModel.findByIdAndUpdate(
      id,
      {
        name: cleanName,
        description: cleanDescription,
        price: priceNumber,
        category,
        subCategory,
        sizes: sizeList,
        bestseller:
          bestseller === true || bestseller === "true" ? "true" : "false",
      },
      { new: true },
    );

    if (!product) {
      return res.json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, message: "Product Updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export {
  listProducts,
  addProduct,
  removeProduct,
  singleProduct,
  updateProduct,
};
