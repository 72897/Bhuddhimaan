import React from 'react'
import { Sparkles, Hash } from 'lucide-react'
import toast from 'react-hot-toast'
import Markdown from 'react-markdown'
import { useAuth } from '@clerk/clerk-react'
import axios from 'axios'

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL

const BlogTitles = () => {
  const blogCategories = [
    { name: 'General' },
    { name: 'Technology' },
    { name: 'Business' },
    { name: 'Health' },
    { name: 'Lifestyle' },
    { name: 'Education' },
    { name: 'Travel' },
    { name: 'Food' },
  ]

  const [selectedCategory, setSelectedCategory] = React.useState(blogCategories[0])
  const [input, setInput] = React.useState('')
  const [generatedTitles, setGeneratedTitles] = React.useState([])
  const [loading, setLoading] = React.useState(false)
  const [content, setContent] = React.useState('')

  const { getToken } = useAuth()

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    if (!input.trim()) {
      toast.error('Please enter a keyword')
      return
    }

    try {
      setLoading(true)
      const prompt = `Generate a blog title for the keyword ${input} in the category of ${selectedCategory.name}.`

      const { data } = await axios.post(
        '/api/ai/generate-blog-title',
        { prompt },
        {
          headers: { Authorization: `Bearer ${await getToken()}` },
        }
      )

      if (data.success) {
        setContent(data.content)
      } else {
        toast.error(data.message || 'Something went wrong')
      }
    } catch (error) {
      toast.error(error.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen flex items-center justify-center p-6  flex-wrap gap-6  text-slate-700 bg-gray-100 dark:bg-gray-900">

      {/* Left Column */}
      <form
        onSubmit={onSubmitHandler}
        className="w-full max-w-lg p-6 bg-white rounded-xl border border-gray-200 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-6 h-6 text-purple-500" />
          <h1 className="text-xl font-semibold text-gray-800">AI Title Generator</h1>
        </div>

        {/* Keyword Input */}
        <p className="mt-4 text-sm font-medium text-gray-700">Keyword</p>
        <input
          onChange={(e) => setInput(e.target.value)}
          type="text"
          value={input}
          className="w-full p-3 mt-2 text-sm rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder-gray-400"
          placeholder="The future of artificial intelligence..."
          required
        />

        {/* Categories */}
        <p className="mt-6 text-sm font-medium text-gray-700">Category</p>
        <div className="flex gap-2 flex-wrap mt-2">
          {blogCategories.map((category, index) => (
            <span
              key={index}
              onClick={() => setSelectedCategory(category)}
              className={`text-xs px-4 py-2 rounded-full cursor-pointer transition border 
                ${selectedCategory.name === category.name
                  ? 'bg-purple-100 border-purple-400 text-purple-700 font-medium'
                  : 'border-gray-300 text-gray-600 hover:bg-purple-50 hover:border-purple-400'
                }`}
            >
              {category.name}
            </span>
          ))}
        </div>

        {/* Submit Button */}
        <button
          disabled={loading}
          type="submit"
          className="w-full flex justify-center items-center gap-2 
                     bg-gradient-to-r from-purple-600 to-purple-400 
                     text-white px-4 py-3 mt-6 text-sm 
                     rounded-lg cursor-pointer hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Hash className="w-4 h-4 animate-spin" />
              Generating...
            </span>
          ) : (
            'Generate title'
          )}
        </button>
      </form>

      {/* Right Column */}
      <div className="w-full max-w-lg p-6 bg-white rounded-xl border flex flex-col border-gray-200 min-h-96 max-h-[600px] overflow-y-auto">
        <div className="flex items-center gap-2 mb-4">
          <Hash className="w-5 h-5 text-purple-500" />
          <h1 className="text-xl font-semibold text-gray-800">Generated Titles</h1>
        </div>

        {/* Display Output */}
        {!content ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <Hash className="w-9 h-9 mb-2 text-gray-400" />
            <p className="text-center text-sm">
              Enter a topic and click <strong>“Generate title”</strong> to get started.
            </p>
          </div>
        ) : (
          <div className="mt-3 h-full overflow-y-scroll text-sm text-slate-900 reset-tw">
            <Markdown>{content}</Markdown>
          </div>
        )}
      </div>
    </div>
  )
}

export default BlogTitles
