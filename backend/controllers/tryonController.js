import mongoose from "mongoose";
import productModel from "../models/productModel.js";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const POLL_INTERVAL_MS = 5000;
const JOB_DEADLINE_MS = 720000; // 12 minutes total (free T4 takes about 7)
const REQUEST_TIMEOUT_MS = 60000; // each request to Colab
const IMAGE_TIMEOUT_MS = 60000; // downloading the product image

const isEnabled = () => process.env.TRYON_ENABLED === "true";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Tells the frontend whether to show the "Try it on" button
const getTryOnStatus = (req, res) => {
  res.json({ success: true, enabled: isEnabled() });
};

// Maps a store product to the category FASHN expects
const pickCategory = (product) => {
  const text =
    `${product.subCategory || ""} ${product.name || ""}`.toLowerCase();
  if (/bottom|pant|jean|trouser|short|skirt|jogger/.test(text))
    return "bottoms";
  if (/dress|jumpsuit|saree|one.?piece/.test(text)) return "one-pieces";
  return "tops";
};

// Downloads the real product image from its stored URL
const fetchProductImage = async (url) => {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(IMAGE_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error("Could not load product image");
  return response.blob();
};

// Calls the Colab service with the shared key and a timeout
const callService = (path, options = {}) => {
  const baseUrl = process.env.TRYON_SERVICE_URL.replace(/\/$/, "");
  return fetch(baseUrl + path, {
    ...options,
    headers: { "x-service-key": process.env.TRYON_SERVICE_KEY },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
};

const tryOn = async (req, res) => {
  let step = "validate";
  try {
    if (!isEnabled()) {
      return res.json({
        success: false,
        message: "Virtual try-on is not available right now.",
      });
    }
    if (!process.env.TRYON_SERVICE_URL || !process.env.TRYON_SERVICE_KEY) {
      return res.json({
        success: false,
        message: "Try-on service is not configured.",
      });
    }

    const { productId } = req.body;
    const photo = req.file; // kept in memory only, never saved

    if (!photo) {
      return res.json({ success: false, message: "Please upload a photo." });
    }
    if (!ALLOWED_TYPES.includes(photo.mimetype)) {
      return res.json({
        success: false,
        message: "Only JPG, PNG or WEBP photos are allowed.",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.json({ success: false, message: "Product not found." });
    }

    // The garment image always comes from the stored product, never from the client
    step = "load product";
    const product = await productModel.findById(productId).lean();
    if (!product || !product.image?.length) {
      return res.json({ success: false, message: "Product not found." });
    }

    step = "download product image";
    const garmentBlob = await fetchProductImage(product.image[0]);

    step = "start job on Colab";
    const form = new FormData();
    form.append(
      "person",
      new Blob([photo.buffer], { type: photo.mimetype }),
      "person.jpg",
    );
    form.append("garment", garmentBlob, "garment.jpg");
    form.append("category", pickCategory(product));

    const startResponse = await callService("/try-on", {
      method: "POST",
      body: form,
    });
    if (!startResponse.ok) {
      console.log("TRYON SERVICE ERROR (start):", startResponse.status);
      return res.json({
        success: false,
        message: "Could not start the try-on. Please try again.",
      });
    }
    const { job_id: jobId } = await startResponse.json();
    console.log("TRYON job started:", jobId);

    // Check the status every few seconds until the job finishes
    step = "poll job status";
    const deadline = Date.now() + JOB_DEADLINE_MS;
    let status = "queued";
    let lastLoggedStatus = "";
    while (Date.now() < deadline) {
      await sleep(POLL_INTERVAL_MS);
      const statusResponse = await callService(`/try-on/${jobId}`);
      if (!statusResponse.ok) {
        console.log("TRYON SERVICE ERROR (status):", statusResponse.status);
        return res.json({
          success: false,
          message: "Could not create the try-on image. Please try again.",
        });
      }
      ({ status } = await statusResponse.json());
      if (status !== lastLoggedStatus) {
        console.log("TRYON status:", status);
        lastLoggedStatus = status;
      }
      if (status === "done" || status === "error") break;
    }

    if (status === "error") {
      return res.json({
        success: false,
        message: "Could not create the try-on image. Try a clearer photo.",
      });
    }
    if (status !== "done") {
      return res.json({
        success: false,
        message: "Try-on is taking too long. Please try again.",
      });
    }

    // Fetch the finished image
    step = "fetch result";
    const resultResponse = await callService(`/try-on/${jobId}/result`);
    if (!resultResponse.ok) {
      console.log("TRYON SERVICE ERROR (result):", resultResponse.status);
      return res.json({
        success: false,
        message: "Could not load the try-on image. Please try again.",
      });
    }
    const buffer = Buffer.from(await resultResponse.arrayBuffer());
    console.log("TRYON done");
    res.json({
      success: true,
      image: `data:image/png;base64,${buffer.toString("base64")}`,
    });
  } catch (error) {
    console.log(`TRYON ERROR at step "${step}":`, error.name, error.message);
    const timedOut =
      error.name === "TimeoutError" || error.name === "AbortError";
    res.json({
      success: false,
      message: timedOut
        ? "Try-on took too long. Please try again."
        : "Try-on is unavailable right now. Please try again.",
    });
  }
};

export { getTryOnStatus, tryOn };
