import React, { useState, useEffect } from "react";
import { HiSparkles } from "react-icons/hi";
import { FaGem } from "react-icons/fa";
import CreationItem from "../components/CreationItem";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

// Placeholder for TotalCreations component
const TotalCreations = () => <span>Total Creations</span>;

// Placeholder for ActivePlan component
const ActivePlan = () => <span>Active Plan</span>;

// ✅ Simple Protect wrapper (if not using Clerk SignedIn/SignedOut)
const Protect = ({ condition, fallback, children }) => {
  return condition() ? children : fallback;
};

const Dashboard = () => {
  const [creations, setCreations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getToken } = useAuth();

  const getDashboardData = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/user/get-user-creations", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (data.success) {
        setCreations(data.creations);
      } else {
        toast.error(data.message || "Failed to fetch dashboard data");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    getDashboardData();
  }, []);

  return (
    <div className="h-full overflow-y-scroll p-6 bg-gray-100 dark:bg-gray-900">
      {/* Stats Cards */}
      <div className="flex justify-start gap-4 flex-wrap">
        {/* Total Creations card */}
        <div className="flex justify-between items-center w-72 p-4 px-6   bg-white rounded-xl border border-gray-200">
          <div>
            <p className="text-sm text-gray-500 text-bold ">
              <TotalCreations />
            </p>
            <h2 className="text-lg font-semibold text-gray-800 ">
              {(creations || []).length}
            </h2>
          </div>
          <div className="bg-blue-500 p-2 rounded-full">
            <HiSparkles className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Active Plan card */}
        <div className="flex justify-between items-center w-72 p-4 px-6 bg-white rounded-xl border border-gray-200">
          <div>
            <p className="text-sm text-gray-500">
              <ActivePlan />
            </p>
            <h2 className="text-xl font-semibold text-gray-800">
              <Protect condition={() => true} fallback="Free Plan">
                Premium
              </Protect>
            </h2>
          </div>
          <div className="bg-purple-500 p-2 rounded-full">
            <FaGem className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      {/* Loader */}
      {loading ? (
        <div className="flex-1 h-full flex items-center justify-center">
          <div className="w-10 h-10 my-1 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Recent Creations */}
          <div className="space-y-3">
            <p className="mt-6 mb-4 text-white">Recent Creations</p>
            {(creations || []).length > 0 ? (
              (creations || []).map((item) => (
                <CreationItem key={item.id} item={item} />
              ))
            ) : (
              <p className="text-white">No creations yet.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
