import orderModel from "../models/orderModel.js";
import productModel from "../models/productModel.js";
import userModel from "../models/userModel.js";

const getDashboardStats = async (req, res) => {
  try {
    const [totalProducts, totalOrders, totalUsers, orders] = await Promise.all([
      productModel.countDocuments(),
      orderModel.countDocuments(),
      userModel.countDocuments(),
      orderModel.find({}),
    ]);

    const totalRevenue = orders.reduce((sum, order) => sum + order.amount, 0);

    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    const recentOrders = orders
      .sort((a, b) => b.date - a.date)
      .slice(0, 5)
      .map((order) => ({
        _id: order._id,
        amount: order.amount,
        status: order.status,
        paymentMethod: order.paymentMethod,
        date: order.date,
      }));

    res.json({
      success: true,
      stats: {
        totalProducts,
        totalOrders,
        totalUsers,
        totalRevenue,
        statusCounts,
        recentOrders,
      },
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export { getDashboardStats };
