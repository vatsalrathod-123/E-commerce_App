import { v2 as cloudinary } from "cloudinary";
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

    // Optional transparent garment cutout for the live try-on feature
    const tryOnFile = req.files.tryOnImage && req.files.tryOnImage[0];
    if (
      tryOnFile &&
      !["image/png", "image/webp"].includes(tryOnFile.mimetype)
    ) {
      return res.json({
        success: false,
        message: "Try-on image must be a transparent PNG or WebP",
      });
    }

    let imagesURL = await Promise.all(
      images.map(async (item) => {
        let result = await cloudinary.uploader.upload(item.path, {
          resource_type: "image",
        });
        return result.secure_url;
      }),
    );

    let tryOnImageURL = "";
    if (tryOnFile) {
      const result = await cloudinary.uploader.upload(tryOnFile.path, {
        resource_type: "image",
      });
      tryOnImageURL = result.secure_url;
    }

    const productData = {
      name,
      description,
      category,
      price: Number(price),
      subCategory,
      bestseller: bestseller === "true" ? "true" : "false",
      sizes: JSON.parse(sizes),
      image: imagesURL,
      tryOnImage: tryOnImageURL,
      tryOnType: tryOnImageURL ? "top" : "",
      date: Date.now(),
    };

    console.log(productData);

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
const removeProduct = async (req, res) => {
  try {
    const product = await productModel.findById(req.body.id);
    if (product) {
      const allImages = [...product.image, product.tryOnImage].filter(Boolean);
      for (const imgUrl of allImages) {
        const publicId = imgUrl.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      }
    }
    await productModel.findByIdAndDelete(req.body.id);
    res.json({ success: true, message: "Product Removed" });
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

export { listProducts, addProduct, removeProduct, singleProduct };
