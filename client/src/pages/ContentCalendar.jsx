import React, { useState, useEffect } from 'react'
import { 
  Calendar, 
  Clock, 
  Trash2, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Edit, 
  Linkedin, 
  Twitter, 
  Instagram,
  Sparkles
} from 'lucide-react'
import { toast } from 'react-hot-toast'

const ContentCalendar = () => {
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date())
  const [posts, setPosts] = useState([])
  const [selectedPost, setSelectedPost] = useState(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  
  // Form states
  const [formDate, setFormDate] = useState('')
  const [formTime, setFormTime] = useState('09:00')
  const [formChannel, setFormChannel] = useState('linkedin')
  const [formContent, setFormContent] = useState('')

  // Load posts from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('buddhimaan_scheduled_posts')
    if (saved) {
      try {
        setPosts(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse scheduled posts:', e)
      }
    }
  }, [])

  // Helper to save posts
  const savePosts = (updatedPosts) => {
    setPosts(updatedPosts)
    localStorage.setItem('buddhimaan_scheduled_posts', JSON.stringify(updatedPosts))
  }

  // Get days in current month
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayIndex = new Date(year, month, 1).getDay()

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Format date helper (YYYY-MM-DD)
  const getLocalDateString = (dayNum) => {
    const d = new Date(year, month, dayNum)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  // Handle Drag & Drop rescheduling
  const handleDragStart = (e, postId) => {
    e.dataTransfer.setData('text/plain', postId)
  }

  const handleDrop = (e, targetDateStr) => {
    e.preventDefault()
    const postId = e.dataTransfer.getData('text/plain')
    const updated = posts.map(post => {
      if (post.id === postId) {
        toast.success(`Rescheduled to ${targetDateStr}`)
        return { ...post, date: targetDateStr }
      }
      return post
    })
    savePosts(updated)
  }

  // Create new post manually
  const handleAddPost = (e) => {
    e.preventDefault()
    if (!formContent.trim() || !formDate) {
      toast.error('Please enter content and date.')
      return
    }

    const newPostObj = {
      id: `post-${Date.now()}`,
      date: formDate,
      time: formTime,
      channel: formChannel,
      content: formContent
    }

    savePosts([...posts, newPostObj])
    setIsAddOpen(false)
    resetForm()
    toast.success('Post scheduled successfully!')
  }

  // Update existing post
  const handleUpdatePost = (e) => {
    e.preventDefault()
    if (!formContent.trim() || !formDate) {
      toast.error('Please fill in all fields.')
      return
    }

    const updated = posts.map(p => {
      if (p.id === selectedPost.id) {
        return { ...p, date: formDate, time: formTime, channel: formChannel, content: formContent }
      }
      return p
    })

    savePosts(updated)
    setIsEditOpen(false)
    setSelectedPost(null)
    resetForm()
    toast.success('Post updated!')
  }

  // Delete post
  const handleDeletePost = (postId) => {
    const updated = posts.filter(p => p.id !== postId)
    savePosts(updated)
    setIsEditOpen(false)
    setSelectedPost(null)
    toast.success('Post removed from calendar')
  }

  const resetForm = () => {
    setFormDate('')
    setFormTime('09:00')
    setFormChannel('linkedin')
    setFormContent('')
  }

  const openAddModal = (dateStr = '') => {
    resetForm()
    if (dateStr) {
      setFormDate(dateStr)
    } else {
      const todayStr = new Date().toISOString().split('T')[0]
      setFormDate(todayStr)
    }
    setIsAddOpen(true)
  }

  const openEditModal = (post) => {
    setSelectedPost(post)
    setFormDate(post.date)
    setFormTime(post.time)
    setFormChannel(post.channel)
    setFormContent(post.content)
    setIsEditOpen(true)
  }

  // Get channel styles
  const getChannelStyle = (channel) => {
    switch (channel) {
      case 'linkedin':
        return {
          bg: 'bg-blue-950/40 hover:bg-blue-900/40 border-blue-500/30 text-blue-300',
          badge: 'bg-blue-600 text-white',
          Icon: Linkedin
        }
      case 'twitter':
        return {
          bg: 'bg-gray-800/60 hover:bg-gray-700/60 border-gray-600/30 text-gray-200',
          badge: 'bg-white text-black',
          Icon: Twitter
        }
      case 'instagram':
        return {
          bg: 'bg-pink-950/40 hover:bg-pink-900/40 border-pink-500/30 text-pink-300',
          badge: 'bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-500 text-white',
          Icon: Instagram
        }
      default:
        return {
          bg: 'bg-slate-900/40 hover:bg-slate-800/40 border-slate-700/30 text-slate-300',
          badge: 'bg-slate-600 text-white',
          Icon: Calendar
        }
    }
  }

  // Generate calendar grid array
  const gridCells = []
  
  // Empty padding cells for start of month
  for (let i = 0; i < firstDayIndex; i++) {
    gridCells.push({ type: 'empty', id: `empty-${i}` })
  }

  // Days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = getLocalDateString(d)
    const dayPosts = posts.filter(p => p.date === dateStr)
    gridCells.push({
      type: 'day',
      dayNum: d,
      dateStr,
      dayPosts
    })
  }

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="min-h-screen bg-gray-900 text-slate-100 p-6 overflow-y-auto">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
            <Calendar className="w-8 h-8 text-indigo-400" />
            Content Campaign Calendar
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Drag-and-drop to reschedule, manage multi-channel AI social campaigns, and structure your scheduling calendar.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-800/80 border border-slate-700/80 p-1 rounded-xl items-center shadow-lg">
            <button 
              onClick={prevMonth}
              className="p-2 hover:bg-slate-700/60 rounded-lg text-slate-300 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 font-bold text-sm min-w-[140px] text-center text-slate-200">
              {monthNames[month]} {year}
            </span>
            <button 
              onClick={nextMonth}
              className="p-2 hover:bg-slate-700/60 rounded-lg text-slate-300 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <button 
            onClick={() => openAddModal()}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-bold py-2.5 px-4 rounded-xl shadow-md shadow-indigo-500/20 transition-all cursor-pointer text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Post</span>
          </button>
        </div>
      </div>

      {/* Main Calendar Grid */}
      <div className="max-w-7xl mx-auto bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        {/* Weekday Titles */}
        <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-900/80">
          {weekdays.map((w, idx) => (
            <div 
              key={w} 
              className={`p-3 text-center text-xs font-bold tracking-wider uppercase ${
                idx === 0 || idx === 6 ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              {w}
            </div>
          ))}
        </div>

        {/* Cells Grid */}
        <div className="grid grid-cols-7 grid-flow-row auto-rows-[140px] bg-slate-950/20">
          {gridCells.map((cell) => {
            if (cell.type === 'empty') {
              return (
                <div 
                  key={cell.id} 
                  className="bg-slate-950/40 border-r border-b border-slate-900/60 opacity-30"
                />
              )
            }

            const isToday = 
              new Date().getDate() === cell.dayNum && 
              new Date().getMonth() === month && 
              new Date().getFullYear() === year

            return (
              <div 
                key={cell.dateStr}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, cell.dateStr)}
                className={`group relative p-2 border-r border-b border-slate-900 hover:bg-slate-900/30 transition-all flex flex-col justify-between ${
                  isToday ? 'bg-slate-900/20 shadow-[inset_0_0_8px_rgba(79,70,229,0.15)]' : ''
                }`}
              >
                {/* Cell Day Header */}
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-extrabold ${
                    isToday 
                      ? 'w-6 h-6 flex items-center justify-center bg-indigo-500 text-white rounded-full' 
                      : 'text-slate-400'
                  }`}>
                    {cell.dayNum}
                  </span>
                  
                  {/* Hover Quick Schedule Button */}
                  <button 
                    onClick={() => openAddModal(cell.dateStr)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Scheduled Posts Area */}
                <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-hide">
                  {cell.dayPosts.map((post) => {
                    const style = getChannelStyle(post.channel)
                    const ChannelIcon = style.Icon
                    return (
                      <div 
                        key={post.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, post.id)}
                        onClick={() => openEditModal(post)}
                        className={`p-1.5 rounded-lg border text-left cursor-grab active:cursor-grabbing transition-all select-none flex items-center gap-1.5 ${style.bg}`}
                      >
                        <div className={`p-0.5 rounded-md ${style.badge} flex-shrink-0`}>
                          <ChannelIcon className="w-3 h-3" />
                        </div>
                        <span className="text-[11px] truncate font-medium flex-1">
                          {post.time} - {post.content}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal - Edit / Delete / View details */}
      {isEditOpen && selectedPost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className={`p-1.5 rounded-lg ${getChannelStyle(formChannel).badge} text-white`}>
                  {React.createElement(getChannelStyle(formChannel).Icon, { className: 'w-4 h-4' })}
                </span>
                <h3 className="text-lg font-bold capitalize">{formChannel} Post Details</h3>
              </div>
              <button 
                onClick={() => { setIsEditOpen(false); setSelectedPost(null); }}
                className="text-slate-400 hover:text-slate-200 p-1 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdatePost} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Scheduled Date</label>
                  <input 
                    type="date" 
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Scheduled Time</label>
                  <input 
                    type="time" 
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Channel</label>
                <div className="grid grid-cols-3 gap-2">
                  {['linkedin', 'twitter', 'instagram'].map((chan) => (
                    <button
                      key={chan}
                      type="button"
                      onClick={() => setFormChannel(chan)}
                      className={`py-2 px-3 rounded-lg border text-sm font-semibold capitalize flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        formChannel === chan
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                      }`}
                    >
                      {React.createElement(getChannelStyle(chan).Icon, { className: 'w-4 h-4' })}
                      <span>{chan}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Post Content</label>
                <textarea 
                  rows="6"
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none transition-colors resize-none"
                  required
                />
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => handleDeletePost(selectedPost.id)}
                  className="flex items-center gap-1.5 bg-red-950/40 text-red-400 border border-red-500/20 hover:bg-red-900/40 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Post</span>
                </button>
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setIsEditOpen(false); setSelectedPost(null); }}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-sm font-bold transition-colors shadow-md shadow-indigo-500/10 cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Add New Post */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold">Schedule Social Post</h3>
              </div>
              <button 
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPost} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Scheduled Date</label>
                  <input 
                    type="date" 
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Scheduled Time</label>
                  <input 
                    type="time" 
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Channel</label>
                <div className="grid grid-cols-3 gap-2">
                  {['linkedin', 'twitter', 'instagram'].map((chan) => (
                    <button
                      key={chan}
                      type="button"
                      onClick={() => setFormChannel(chan)}
                      className={`py-2 px-3 rounded-lg border text-sm font-semibold capitalize flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        formChannel === chan
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                      }`}
                    >
                      {React.createElement(getChannelStyle(chan).Icon, { className: 'w-4 h-4' })}
                      <span>{chan}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Post Content</label>
                <textarea 
                  rows="5"
                  value={formContent}
                  placeholder="What would you like to schedule?"
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none transition-colors resize-none"
                  required
                />
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-sm font-bold transition-colors shadow-md shadow-indigo-500/10 cursor-pointer"
                >
                  Schedule Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ContentCalendar
