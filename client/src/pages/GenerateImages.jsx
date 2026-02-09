import React from "react"
import { Image as ImageIcon, Sparkles } from "lucide-react"
import axios from "axios"
import { useAuth } from "@clerk/clerk-react"
import toast from "react-hot-toast"
import gradientBackground from '../assets/pattern.png';

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const GenerateImages = () => {
  const styles = [
    { name: "Realistic" },
    { name: "Ghibli Style" },
    { name: "Pixel Art" },
    { name: "Cartoon" },
    { name: "Fantasy style" },
    { name: "3D style" },
  ]

  const [selectedStyle, setSelectedStyle] = React.useState(styles[0])
  const [input, setInput] = React.useState("")
  const [generatedImage, setGeneratedImage] = React.useState(null)
  const [publish, setPublish] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const { getToken } = useAuth()

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    if (!input.trim()) {
      toast.error("Please describe your image")
      return
    }

    try {
      setLoading(true)
      const prompt = `Generate an image of ${input} in the style of ${selectedStyle.name}.`

      const { data } = await axios.post(
        "/api/ai/generate-image",
        { prompt, publish },
        {
          headers: { Authorization: `Bearer ${await getToken()}` },
        }
      )

      if (data.success) {
        setGeneratedImage(data.content) // assuming backend returns image URL in data.content
      } else {
        toast.error(data.message || "Something went wrong")
      }
    } catch (error) {
      toast.error(error.message || "Request failed")
    } finally {
      setLoading(false)
    }
  }

  return (

   

    <div className="h-screen flex items-center justify-center p-6  flex-wrap gap-6 bg-gray-50 text-slate-700 bg-gray-100 dark:bg-gray-900">
      {/* Left Column */}
      <form
        onSubmit={onSubmitHandler}
        className="w-full max-w-lg p-6 bg-white rounded-xl border border-gray-200 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-6 h-6 text-green-500" />
          <h1 className="text-xl font-semibold text-gray-800">AI Image Generator</h1>
        </div>

        {/* Input */}
        <p className="mt-4 text-sm font-medium text-gray-700">Describe Your Image</p>
        <textarea
          onChange={(e) => setInput(e.target.value)}
          value={input}
          rows={3}
          className="w-full p-3 mt-2 text-sm rounded-lg border border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 placeholder-gray-400"
          placeholder="Describe what you want to see in the image..."
          required
        />

        {/* Style */}
        <p className="mt-6 text-sm font-medium text-gray-700">Style</p>
        <div className="flex gap-2 flex-wrap mt-2">
          {styles.map((style, index) => (
            <span
              key={index}
              onClick={() => setSelectedStyle(style)}
              className={`text-xs px-4 py-2 rounded-full cursor-pointer transition border 
                ${
                  selectedStyle.name === style.name
                    ? "bg-green-100 border-green-400 text-green-700 font-medium"
                    : "border-gray-300 text-gray-600 hover:bg-green-50 hover:border-green-400"
                }`}
            >
              {style.name}
            </span>
          ))}
        </div>

        {/* Fancy Toggle */}
        <div className="my-6 flex items-center gap-2">
          <label className="relative cursor-pointer">
            <input
              type="checkbox"
              onChange={(e) => setPublish(e.target.checked)}
              checked={publish}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-300 rounded-full peer-checked:bg-green-500 transition"></div>
            <span className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition peer-checked:translate-x-4"></span>
          </label>
          <p className="text-sm">Make this image Public</p>
        </div>

        {/* Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 
                     bg-gradient-to-r from-green-600 to-green-400 
                     text-white px-4 py-3 mt-6 text-sm 
                     rounded-lg cursor-pointer hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 animate-spin" />
              Generating...
            </span>
          ) : (
            <>
              <ImageIcon className="w-4 h-4" />
              Generate image
            </>
          )}
        </button>
      </form>

      {/* Right Column */}
      <div className="w-full max-w-lg p-6 bg-white rounded-xl border flex flex-col border-gray-200 min-h-96 max-h-[600px] overflow-y-auto">
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon className="w-5 h-5 text-green-500" />
          <h1 className="text-xl font-semibold text-gray-800">Generated image</h1>
        </div>

        {!generatedImage ? (
          <div className="flex flex-col items-center justify-center flex-1 text-gray-500">
            {loading ? (
              <span className="w-6 h-6 rounded-full border-2 border-gray-300 border-t-green-500 animate-spin mb-3"></span>
            ) : (
              <ImageIcon className="w-9 h-9 mb-2 text-gray-400" />
            )}
            <p>Describe an image and click “Generate Image” to get started.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <img
              src={generatedImage}
              alt="Generated"
              className="rounded-lg border shadow-sm max-h-[400px] object-contain"
            />
            <p className="text-gray-500 text-xs">
              {publish ? "🔓 This image is Public" : "🔒 This image is Private"}
            </p>
          </div>
        )}
      </div>
    </div>
    

    
  )
}

export default GenerateImages
