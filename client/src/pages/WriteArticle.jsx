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
    <div className="min-h-screen bg-gray-900 text-slate-100 p-6 overflow-y-auto pb-12">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-blue-400" />
            AI Content Studio
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Generate full articles and instantly spin out multi-channel social distribution campaigns.
          </p>
        </div>
        {campaign && (
          <Link
            to="/ai/content-calendar"
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold py-2.5 px-4 rounded-xl border border-slate-700/80 transition-all text-sm"
          >
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span>Open Content Calendar</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Form Configuration */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
            <Edit className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-slate-200">Article Settings</h2>
          </div>

          <form onSubmit={onSubmitHandler} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Topic or Keyword</label>
              <input
                onChange={(e) => setInput(e.target.value)}
                type="text"
                value={input}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none transition-colors"
                placeholder="e.g., The Future of Remote Work & Productivity..."
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Target Word Count</label>
              <div className="flex flex-col gap-2">
                {articleLength.map((item, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedLength(item)}
                    className={`text-left text-xs py-3 px-4 rounded-xl border font-medium transition-all ${
                      selectedLength.text === item.text
                        ? 'bg-indigo-600/10 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-500/5'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900 hover:border-slate-700'
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
              className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-bold py-3.5 rounded-xl cursor-pointer disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/15"
            >
              {loading ? (
                <span className="w-5 h-5 rounded-full border-2 border-t-transparent border-white animate-spin"></span>
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
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col h-[600px]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h2 className="text-xl font-bold text-slate-200">Generated Copy</h2>
              {content && (
                <span className="text-xs bg-indigo-500/10 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/20 font-semibold">
                  Article Ready
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide pr-1">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                  <span className="w-8 h-8 border-3 border-t-transparent border-indigo-500 rounded-full animate-spin" />
                  <p className="text-xs">Drafting article outline and writing copy...</p>
                </div>
              ) : !content ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 gap-3">
                  <Edit className="w-12 h-12 text-slate-700" />
                  <p className="text-sm max-w-xs">Enter your topic settings on the left to generate the core article copy.</p>
                </div>
              ) : (
                <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed space-y-4">
                  <Markdown>{content}</Markdown>
                </div>
              )}
            </div>
          </div>

          {/* Social Distribution Column */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col h-[600px]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h2 className="text-xl font-bold text-slate-200">Campaign Creator</h2>
              <Share2 className="w-5 h-5 text-indigo-400" />
            </div>

            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              {!content ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 gap-3">
                  <Share2 className="w-12 h-12 text-slate-700" />
                  <p className="text-sm max-w-xs">Create the article copy first to unlock the social media campaign writer.</p>
                </div>
              ) : campaignLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                  <span className="w-8 h-8 border-3 border-t-transparent border-indigo-500 rounded-full animate-spin" />
                  <p className="text-xs">Analyzing article and creating social copies...</p>
                </div>
              ) : !campaign ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-5">
                  <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-200">Generate Social Campaign</h3>
                    <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
                      Automatically craft custom promotional posts for LinkedIn, Twitter/X, and Instagram. Uses settings in your Brand Hub context profile.
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateCampaign}
                    className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition-all cursor-pointer text-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Campaign</span>
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-between overflow-hidden">
                  {/* Channels Tab Bar */}
                  <div className="flex border-b border-slate-800/80 mb-4 p-1 bg-slate-950/40 rounded-xl">
                    {['linkedin', 'twitter', 'instagram'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize transition-all cursor-pointer ${
                          activeTab === tab
                            ? 'bg-indigo-600 border border-indigo-500/20 text-white shadow-md'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* Tab Contents */}
                  <div className="flex-1 overflow-y-auto bg-slate-950/30 border border-slate-800/80 rounded-xl p-4 mb-4 relative scrollbar-hide text-xs leading-relaxed">
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button
                        onClick={() => {
                          const val = activeTab === 'twitter' 
                            ? campaign.twitter.join('\n\n--- Next Tweet ---\n\n') 
                            : campaign[activeTab]
                          handleCopyToClipboard(val)
                        }}
                        className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg text-slate-300 transition-colors"
                        title="Copy to Clipboard"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {activeTab === 'twitter' ? (
                      <div className="space-y-4 pt-4">
                        {campaign.twitter.map((tweet, idx) => (
                          <div key={idx} className="p-3 bg-slate-900 border border-slate-850 rounded-xl space-y-2">
                            <span className="text-[10px] font-bold text-indigo-400">Tweet {idx + 1} of {campaign.twitter.length}</span>
                            <p className="whitespace-pre-line text-slate-300">{tweet}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="whitespace-pre-line text-slate-300 pt-6">
                        {campaign[activeTab]}
                      </div>
                    )}
                  </div>

                  {/* Scheduling Area */}
                  <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl space-y-3">
                    <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-indigo-400" />
                      Campaign Scheduler
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-500 font-semibold uppercase mb-1">Date</label>
                        <input
                          type="date"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs focus:border-indigo-500 focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-semibold uppercase mb-1">Time</label>
                        <input
                          type="time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs focus:border-indigo-500 focus:outline-none transition-colors"
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
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg shadow-md cursor-pointer transition-colors"
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
