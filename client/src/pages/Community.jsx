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
    <div className="h-full w-full overflow-y-auto flex flex-col justify-start p-6 text-slate-700 bg-gray-100 dark:bg-gray-900 scroll-hidden">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">Creations Feed</h1>

      {/* Grid for cards */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 bg-transparent pb-8">
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
    <div className="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <span className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></span>
    </div>
  );
};

export default Community;
