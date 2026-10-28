import productModel from "../models/productModel.js";

const MODEL = process.env.TRYON_MODEL || "gemini-2.5-flash-preview-image";
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const isEnabled = () => process.env.TRYON_ENABLED === "true";

// Tells the frontend whether to show the "Try it on" button
const getTryOnStatus = (req, res) => {
  res.json({ success: true, enabled: isEnabled() });
};

// Downloads an image URL and returns its base64 data and mime type
const urlToBase64 = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Could not load product image");
  const mimeType = response.headers.get("content-type") || "image/jpeg";
  const buffer = Buffer.from(await response.arrayBuffer());
  return { mimeType, data: buffer.toString("base64") };
};

const tryOn = async (req, res) => {
  try {
    if (!isEnabled()) {
      return res.json({
        success: false,
        message: "Virtual try-on is not available right now.",
      });
    }

    const { productId } = req.body;
    const photo = req.file; // kept in memory only, never written to disk or database

    if (!photo) {
      return res.json({ success: false, message: "Please upload a photo." });
    }
    if (!ALLOWED_TYPES.includes(photo.mimetype)) {
      return res.json({
        success: false,
        message: "Only JPG, PNG or WEBP photos are allowed.",
      });
    }

    const product = await productModel.findById(productId).lean();
    if (!product || !product.image?.length) {
      return res.json({ success: false, message: "Product not found." });
    }

    const productImage = await urlToBase64(product.image[0]);

    const prompt =
      "Image 1 is a photo of a person. Image 2 is a clothing product. " +
      "Create a realistic photo of the same person wearing the clothing from image 2. " +
      "Keep the person's face, body, pose and background as they are. " +
      "Return only the edited image.";

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: photo.mimetype,
                    data: photo.buffer.toString("base64"),
                  },
                },
                {
                  inline_data: {
                    mime_type: productImage.mimeType,
                    data: productImage.data,
                  },
                },
              ],
            },
          ],
        }),
      },
    );

    const result = await response.json();

    if (!response.ok) {
      console.log("TRYON API ERROR:", response.status, result?.error?.message);
      return res.json({
        success: false,
        message:
          response.status === 429
            ? "Try-on is busy, please try again in a minute."
            : "Could not create the try-on image. Please try again.",
      });
    }

    const parts = result.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p) => p.inlineData || p.inline_data);
    const generated = imagePart?.inlineData || imagePart?.inline_data;

    if (!generated) {
      return res.json({
        success: false,
        message: "Could not create the try-on image. Try a clearer photo.",
      });
    }

    res.json({
      success: true,
      image: `data:${generated.mimeType || generated.mime_type};base64,${generated.data}`,
    });
  } catch (error) {
    console.log("TRYON ERROR:", error.message);
    res.json({
      success: false,
      message: "Try-on is unavailable right now. Please try again.",
    });
  }
};

export { getTryOnStatus, tryOn };
