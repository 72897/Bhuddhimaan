import React, { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Heart } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const Community = () => {
  const [creations, setCreations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  const { getToken } = useAuth();

  // Fetch all published creations
  const fetchCreations = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/user/get-published-creations", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (data.success) {
        setCreations(data.creations);
      } else {
        toast.error(data.message || "Failed to fetch creations");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching creations");
    }
    setLoading(false);
  };

  // Toggle like on an image
  const imageLikeToggle = async (id) => {
    try {
      const token = await getToken();
      const { data } = await axios.post(
        "/api/user/toggle-like-creations",
        { id }, // ✅ fixed body object (was wrong earlier)
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.success) {
        toast.success(data.message || "Action successful");
        await fetchCreations();
      } else {
        toast.error(data.message || "Failed to toggle like");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCreations();
    }
  }, [user]);

  return !loading ? (
    <div className="flex-1 h-full flex-col gap-4 p-6 bg-gray-100 dark:bg-gray-900 overflow-y-hidden scrollbar-hide">
      <h1 className="text-xl font-bold mb-4 text-white">Creations</h1>

      {/* Grid for cards */}
      <div className="h-full w-full rounded-xl p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6  bg-gray-100 dark:bg-gray-900 scrollbar-hide overflow-y-hidden">
        {loading ? (
          <p className="text-center col-span-full text-white">Loading...</p>
        ) : (creations || []).length === 0 ? (
          <p className="text-center col-span-full text-white">No creations found</p>
        ) : (
          (creations || []).map((creation, index) => (
            <div
              key={index}
              className="relative group rounded-xl overflow-hidden shadow-md hover:shadow-xl transition text-white"
            >
              {/* Image with fixed aspect ratio */}
              <div className="aspect-[3/4] w-full">
                <img
                  src={creation.content}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Overlay on hover */}
              <div className="absolute inset-0 flex flex-col justify-end p-3 bg-gradient-to-b from-transparent to-black/70 opacity-0 group-hover:opacity-100 transition">
                <p className="text-sm text-white mb-2">{creation.prompt}</p>

                <div className="flex items-center gap-2 text-white">
                  <p>{(creation.likes || []).length}</p>
                  <Heart
                    onClick={() => imageLikeToggle(creation.id)}
                    className={`w-5 h-5 hover:scale-110 transition cursor-pointer ${(creation.likes || []).includes(user?.id)
                      ? "text-red-500"
                      : "text-gray-300"
                      }`}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  ) : (
    <div className="flex-1 h-full flex items-center justify-center">
      <span className="w-10 h-10 my-1 rounded-full border-3 border-primary border-t-transparent animate-spin"></span>
    </div>
  );
};

export default Community;
