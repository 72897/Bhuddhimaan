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
    <div className='flex flex-col h-screen overflow-hidden bg-gray-100 dark:bg-gray-900'>
      {/* Navbar */}
      <nav className='w-full px-8 h-14 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 flex-shrink-0'>
        <img
          src={logo}
          alt="Logo"
          onClick={() => { navigate('/') }}
          className=" w-12 h-20 sm:w-44 cursor-pointer"
        />
        {sidebar ? (
          <HiX
            onClick={() => { setSidebar(false) }}
            className='w-6 h-6 text-gray-600 sm:hidden cursor-pointer'
          />
        ) : (
          <HiMenu
            onClick={() => { setSidebar(true) }}
            className='w-6 h-6 text-gray-600 sm:hidden cursor-pointer'
          />
        )}
      </nav>

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
