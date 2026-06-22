import React, { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'
import { HiMenu, HiX } from 'react-icons/hi'
import Sidebar from '../components/Sidebar'
import { SignIn, useUser } from '@clerk/clerk-react'
import logo from '../assets/logo1.png'




const Layout = () => {
  const navigate = useNavigate()
  const [sidebar, setSidebar] = useState(false)
  const { user } = useUser();


  return user ? (
    <div className='relative flex flex-col h-screen overflow-hidden bg-gray-100 dark:bg-gray-900'>
      {/* Floating Logo */}
      <img
        src={logo}
        alt="Logo"
        onClick={() => { navigate('/') }}
        className="absolute top-4 left-6 w-10 h-10 object-contain cursor-pointer z-50 hover:opacity-90 transition-opacity"
      />

      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setSidebar(!sidebar)}
        className="absolute top-4 right-4 z-50 p-2 rounded-lg bg-gray-200/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 sm:hidden hover:bg-gray-300 dark:hover:bg-gray-700 transition"
      >
        {sidebar ? <HiX className="w-5 h-5" /> : <HiMenu className="w-5 h-5" />}
      </button>

      {/* Main Content */}
      <div className='flex-1 w-full flex overflow-hidden'>
        <div className='flex-1 bg-gray-100 dark:bg-gray-900 overflow-hidden h-full'>
          <Outlet />
        </div>
        <Sidebar sidebar={sidebar} setSidebar={setSidebar} />
      </div>
    </div>
  ) : (
    <div className='flex items-center justify-center h-screen '>
      <SignIn />
    </div>
  )
}

export default Layout
