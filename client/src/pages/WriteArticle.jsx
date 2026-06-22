import React, { useState } from 'react'
import { Sparkles, Edit, Calendar, Copy, Check, Share2, ArrowRight } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '@clerk/clerk-react'
import { toast } from 'react-hot-toast'
import Markdown from 'react-markdown'
import { Link } from 'react-router-dom'

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL

const WriteArticle = () => {
  const articleLength = [
    { length: 800, text: 'Short (500-800 words)' },
    { length: 1200, text: 'Medium (800-1200 words)' },
    { length: 1600, text: 'Long (1200-1600 words)' },
  ]

  const [selectedLength, setSelectedLength] = useState(articleLength[0])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState('')

  // Campaign State
  const [campaign, setCampaign] = useState(null)
  const [campaignLoading, setCampaignLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('linkedin')
  
  // Scheduling State
  const todayStr = new Date().toISOString().split('T')[0]
  const [scheduleDate, setScheduleDate] = useState(todayStr)
  const [scheduleTime, setScheduleTime] = useState('09:00')
  const [copied, setCopied] = useState(false)

  const { getToken } = useAuth()

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    if (!input.trim()) {
      toast.error('Please enter a valid topic.')
      return
    }

    try {
      setLoading(true)
      setContent('')
      setCampaign(null)
      const prompt = `Write an article about ${input} in ${selectedLength.text}`

      const { data } = await axios.post(
        '/api/ai/generate-article',
        { prompt, length: selectedLength.length },
        {
          headers: {
            Authorization: `Bearer ${await getToken()}`,
          },
        }
      )

      if (data.success) {
        setContent(data.content)
        toast.success('Article generated! Now you can create a social media campaign.')
      } else {
        toast.error(data.message || 'Something went wrong')
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to generate article.')
    } finally {
      setLoading(false)
    }
  }

  // Generate Social Campaign
  const handleGenerateCampaign = async () => {
    if (!content) return

    try {
      setCampaignLoading(true)
      const { data } = await axios.post(
        '/api/ai/generate-campaign',
        { articleTitle: input, articleContent: content },
        {
          headers: {
            Authorization: `Bearer ${await getToken()}`,
          },
        }
      )

      if (data.success) {
        setCampaign(data.campaign)
        toast.success('Social media campaign generated successfully!')
      } else {
        toast.error(data.error || 'Failed to generate campaign')
      }
    } catch (error) {
      console.error(error)
      toast.error('Error generating campaign.')
    } finally {
      setCampaignLoading(false)
    }
  }

  // Copy post text to clipboard
  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  // Schedule Post to Calendar
  const handleSchedulePost = (channel, postContent) => {
    if (!scheduleDate || !scheduleTime) {
      toast.error('Please select both date and time.')
      return
    }

    // Retrieve current scheduled posts
    const saved = localStorage.getItem('buddhimaan_scheduled_posts')
    let currentPosts = []
    if (saved) {
      try {
        currentPosts = JSON.parse(saved)
      } catch (e) {
        console.error(e)
      }
    }

    const newPost = {
      id: `post-${Date.now()}-${channel}`,
      date: scheduleDate,
      time: scheduleTime,
      channel: channel,
      content: postContent
    }

    currentPosts.push(newPost)
    localStorage.setItem('buddhimaan_scheduled_posts', JSON.stringify(currentPosts))
    toast.success(`Successfully scheduled to ${scheduleDate} at ${scheduleTime}!`)
  }

  return (
    <div className="h-full w-full overflow-y-auto flex flex-col justify-start p-6 text-slate-700 bg-gray-100 dark:bg-gray-900 scroll-hidden">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto w-full mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-500" />
            AI Content Studio
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-xs">
            Generate articles and multi-channel social distribution campaigns in one cohesive flow.
          </p>
        </div>
        {campaign && (
          <Link
            to="/ai/content-calendar"
            className="flex items-center gap-2 bg-white hover:bg-gray-50 text-indigo-650 font-bold py-2 px-4 rounded-lg border border-gray-200 shadow-sm transition-all text-xs cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span>Open Content Calendar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6 items-start pb-8">
        {/* Left Column: Form Configuration */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6 text-slate-700">
          <div className="flex items-center gap-2 pb-4 border-b border-gray-200">
            <Edit className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold text-gray-800">Article Settings</h2>
          </div>

          <form onSubmit={onSubmitHandler} className="space-y-5">
            <div>
              <p className="text-sm font-medium text-gray-700">Topic or Keyword</p>
              <input
                onChange={(e) => setInput(e.target.value)}
                type="text"
                value={input}
                className="w-full p-3 mt-2 text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 placeholder-gray-400 focus:outline-none"
                placeholder="e.g. The future of artificial intelligence..."
                required
              />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700">Article Length</p>
              <div className="flex flex-col gap-2 mt-2">
                {articleLength.map((item, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedLength(item)}
                    className={`text-left text-xs py-2.5 px-4 rounded-lg border font-medium transition-all cursor-pointer ${
                      selectedLength.text === item.text
                        ? 'bg-blue-100 border-blue-400 text-blue-700 font-semibold'
                        : 'border-gray-300 text-gray-600 hover:bg-blue-50 hover:border-blue-400'
                    }`}
                  >
                    {item.text}
                  </button>
                ))}
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-450 text-white font-bold py-3 mt-4 text-sm rounded-lg cursor-pointer hover:opacity-95 transition disabled:opacity-50 shadow-sm"
            >
              {loading ? (
                <span className="w-4 h-4 my-0.5 rounded-full border-2 border-t-transparent border-white animate-spin"></span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Article</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Center Column: Generated Article */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Article View */}
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl shadow flex flex-col h-[550px] text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 className="text-lg font-bold text-white">Generated Copy</h2>
              {content && (
                <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-semibold">
                  Ready
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide pr-1">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                  <span className="w-6 h-6 border-2 border-t-transparent border-blue-400 rounded-full animate-spin" />
                  <p className="text-xs">Drafting article copy...</p>
                </div>
              ) : !content ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 gap-3">
                  <Edit className="w-10 h-10 text-slate-650" />
                  <p className="text-xs max-w-xs">Enter your topic settings on the left to generate the article.</p>
                </div>
              ) : (
                <div className="prose prose-invert max-w-none text-slate-300 text-xs leading-relaxed space-y-4">
                  <Markdown>{content}</Markdown>
                </div>
              )}
            </div>
          </div>

          {/* Social Distribution Column */}
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl shadow flex flex-col h-[550px] text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 className="text-lg font-bold text-white">Campaign Creator</h2>
              <Share2 className="w-4 h-4 text-blue-400" />
            </div>

            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              {!content ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 gap-3">
                  <Share2 className="w-10 h-10 text-slate-650" />
                  <p className="text-xs max-w-xs">Generate the article first to unlock campaign creation.</p>
                </div>
              ) : campaignLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                  <span className="w-6 h-6 border-2 border-t-transparent border-indigo-400 rounded-full animate-spin" />
                  <p className="text-xs">Writing social copies...</p>
                </div>
              ) : !campaign ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Spin Out Social Media Posts</h3>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-xs leading-normal">
                      Instantly generate LinkedIn posts, Twitter threads, and Instagram descriptions aligned to your Brand Hub identity.
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateCampaign}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-2 px-5 rounded-lg shadow cursor-pointer transition hover:opacity-90 text-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Campaign</span>
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-between overflow-hidden">
                  {/* Channels Tab Bar */}
                  <div className="flex border-b border-slate-800 mb-3 p-0.5 bg-slate-950/40 rounded-lg">
                    {['linkedin', 'twitter', 'instagram'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-1.5 text-[11px] font-bold rounded capitalize transition-all cursor-pointer ${
                          activeTab === tab
                            ? 'bg-blue-600 border border-blue-500/20 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* Tab Contents */}
                  <div className="flex-1 overflow-y-auto bg-slate-950/30 border border-slate-800 rounded-lg p-3.5 mb-3 relative scrollbar-hide text-[11px] leading-relaxed">
                    <div className="absolute top-2.5 right-2.5 flex gap-1">
                      <button
                        onClick={() => {
                          const val = activeTab === 'twitter' 
                            ? campaign.twitter.join('\n\n--- Next Tweet ---\n\n') 
                            : campaign[activeTab]
                          handleCopyToClipboard(val)
                        }}
                        className="p-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded text-slate-300 transition-colors"
                        title="Copy to Clipboard"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {activeTab === 'twitter' ? (
                      <div className="space-y-3 pt-3">
                        {campaign.twitter.map((tweet, idx) => (
                          <div key={idx} className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
                            <span className="text-[9px] font-bold text-blue-400">Tweet {idx + 1} of {campaign.twitter.length}</span>
                            <p className="whitespace-pre-line text-slate-300">{tweet}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="whitespace-pre-line text-slate-300 pt-5">
                        {campaign[activeTab]}
                      </div>
                    )}
                  </div>

                  {/* Scheduling Area */}
                  <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg space-y-2">
                    <h3 className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" />
                      Campaign Scheduler
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] text-slate-500 font-semibold uppercase mb-0.5">Date</label>
                        <input
                          type="date"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[10px] text-slate-300 focus:border-blue-500 focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-slate-500 font-semibold uppercase mb-0.5">Time</label>
                        <input
                          type="time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[10px] text-slate-300 focus:border-blue-500 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const val = activeTab === 'twitter' 
                          ? campaign.twitter.join('\n\n--- Thread Break ---\n\n') 
                          : campaign[activeTab]
                        handleSchedulePost(activeTab, val)
                      }}
                      className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] rounded cursor-pointer transition-colors shadow-sm"
                    >
                      Schedule {activeTab.toUpperCase()} Post
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WriteArticle
