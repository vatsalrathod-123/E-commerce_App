/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import axios from "axios";
import { backendURL, currency } from "../App";
import { toast } from "react-toastify";
// import { asset } from "../assets/assets";

const Dashboard = ({ token }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await axios.get(backendURL + "/api/dashboard/stats", {
        headers: { token },
      });
      if (response.data.success) {
        setStats(response.data.stats);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) return <p>Loading dashboard...</p>;
  if (!stats) return <p>Could not load dashboard stats.</p>;

  const statusEntries = Object.entries(stats.statusCounts);
  const maxStatusCount = Math.max(
    ...statusEntries.map(([, count]) => count),
    1,
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Products</p>
          <p className="text-2xl font-semibold mt-1">{stats.totalProducts}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-2xl font-semibold mt-1">{stats.totalOrders}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-2xl font-semibold mt-1">{stats.totalUsers}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-semibold mt-1">
            {currency}
            {stats.totalRevenue.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="font-medium mb-4">Orders by Status</p>
          <div className="flex flex-col gap-3">
            {statusEntries.map(([status, count]) => (
              <div key={status}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{status}</span>
                  <span className="text-gray-500">{count}</span>
                </div>
                <div className="w-full bg-gray-100 rounded h-2">
                  <div
                    className="bg-black h-2 rounded"
                    style={{ width: `${(count / maxStatusCount) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="font-medium mb-4">Recent Orders</p>
          <div className="flex flex-col gap-3">
            {stats.recentOrders.map((order) => (
              <div
                key={order._id}
                className="flex justify-between items-center text-sm border-b border-gray-100 pb-2 last:border-0"
              >
                <div>
                  <p>{order.paymentMethod}</p>
                  <p className="text-gray-400 text-xs">
                    {new Date(order.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p>
                    {currency}
                    {order.amount}
                  </p>
                  <p className="text-gray-400 text-xs">{order.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
