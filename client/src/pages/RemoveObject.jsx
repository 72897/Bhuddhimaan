import React, { useState } from "react"
import { Scissors, Upload, Loader2 } from "lucide-react"
import axios from "axios"
import toast from "react-hot-toast"
import { useAuth } from "@clerk/clerk-react"

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL

const RemoveObject = () => {
  const [image, setImage] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)
  const [processedImage, setProcessedImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [object, setObject] = useState("")

  const { getToken } = useAuth()

  // handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImage(file)
      setPreviewImage(URL.createObjectURL(file))
    }
  }

  // call backend API
  const handleRemoveObject = async () => {
    if (!image) return toast.error("Please upload an image first!")
    if (!object.trim()) return toast.error("Please enter an object to remove!")

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("image", image)
      formData.append("object", object)

      const { data } = await axios.post("/api/ai/remove-image-object", formData)

      if (data.success) {
        setProcessedImage(data.content) // backend returns image URL
      } else {
        toast.error(data.message || "Something went wrong")
      }
    } catch (error) {
      toast.error(error.message || "Request failed")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl">

        {/* Upload Section */}
        <div className="bg-white p-8 rounded-3xl shadow-xl border">
          <div className="flex items-center gap-2 mb-4">
            <Scissors className="w-7 h-7 text-orange-500 animate-pulse" />
            <h2 className="text-xl font-bold text-gray-800">AI Object Remover</h2>
          </div>

          <label className="block cursor-pointer mt-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 text-center hover:border-orange-400 hover:bg-orange-50 transition">
              {image ? `📎 ${image.name}` : "Drag & Drop or Click to Upload"}
            </div>
          </label>

          <input
            type="text"
            placeholder="Enter object to remove (e.g. car, tree)"
            value={object}
            onChange={(e) => setObject(e.target.value)}
            className="w-full mt-4 px-4 py-2 border rounded-xl text-sm"
          />

          <button
            disabled={loading}
            onClick={handleRemoveObject}
            className="w-full flex items-center justify-center gap-2 mt-6 px-6 py-3 rounded-xl 
                     bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm font-semibold
                     disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:scale-105 transition"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Scissors className="w-5 h-5" />}
            {loading ? "Processing..." : "Remove Object"}
          </button>
        </div>

        {/* Output Section */}
        <div className="bg-white p-8 rounded-3xl shadow-xl border flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-4">
            <Scissors className="w-6 h-6 text-orange-500" />
            <h2 className="text-lg font-bold text-gray-800">Output Preview</h2>
          </div>

          {loading ? (
            <div className="flex flex-col items-center text-gray-500 text-sm animate-pulse">
              <Loader2 className="w-10 h-10 animate-spin text-orange-400 mb-2" />
              <p>AI is removing objects...</p>
            </div>
          ) : processedImage ? (
            <img src={processedImage} alt="Processed" className="rounded-xl border shadow-md max-h-[400px] object-contain" />
          ) : previewImage ? (
            <img src={previewImage} alt="Uploaded" className="rounded-xl border shadow-md max-h-[400px] object-contain" />
          ) : (
            <div className="flex flex-col items-center text-gray-500 text-sm">
              <Upload className="w-12 h-12 text-gray-400 mb-2" />
              <p>Upload an image and click <span className="font-medium">"Remove Object"</span></p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RemoveObject
