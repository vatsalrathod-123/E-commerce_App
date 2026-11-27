import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";

// Returns the logged-in user's details and account summary
const getProfile = async (req, res) => {
  try {
    const userId = req.body.userId;
    const user = await userModel
      .findById(userId)
      .select("name email cartData")
      .lean();

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const orders = await orderModel
      .find({ userId: String(userId) })
      .select("amount status")
      .lean();

    const totalSpent = orders.reduce(
      (sum, order) => sum + (order.amount || 0),
      0,
    );
    const deliveredOrders = orders.filter(
      (o) => o.status === "Delivered",
    ).length;

    // cartData looks like { productId: { size: quantity } }
    const cartItems = Object.values(user.cartData || {}).reduce(
      (count, sizes) =>
        count + Object.values(sizes || {}).filter((qty) => qty > 0).length,
      0,
    );

    res.json({
      success: true,
      profile: {
        name: user.name,
        email: user.email,
        totalOrders: orders.length,
        deliveredOrders,
        totalSpent,
        cartItems,
      },
    });
  } catch (error) {
    console.log("PROFILE ERROR:", error.message);
    res.json({ success: false, message: "Could not load your profile." });
  }
};

export { getProfile };
