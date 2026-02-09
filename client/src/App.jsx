import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Layout from './pages/Layout'
import Dashboard from './pages/Dashboard'
import WriteArticle from './pages/WriteArticle'
import BlogTitles from './pages/BlogTitles'
import GenerateImages from './pages/GenerateImages'
import RemoveBackground from './pages/RemoveBackground'
import RemoveObject from './pages/RemoveObject'
import ReviewResume from './pages/ReviewResume'
import Community from './pages/Community'
import { Toaster } from 'react-hot-toast'
import { useAuth } from '@clerk/clerk-react'

// ✅ Import Mona Sans from @fontsource
import '@fontsource/mona-sans/400.css'
import '@fontsource/mona-sans/700.css'
import GenerateWebsite from './pages/GenerateWebsite'

const App = () => {
  return (
    <div className='dark font-[Mona_Sans] antialiased bg-gray-100 dark:bg-gray-900'>
      <Toaster />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/ai' element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path='write-article' element={<WriteArticle />} />
          <Route path='blog-titles' element={<BlogTitles />} />
          <Route path='generate-images' element={<GenerateImages />} />
          <Route path='remove-background' element={<RemoveBackground />} />
          <Route path='remove-object' element={<RemoveObject />} />
          <Route path='review-resume' element={<ReviewResume />} />
          <Route path='community' element={<Community />} />
          <Route path='generate-website' element={<GenerateWebsite />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App
