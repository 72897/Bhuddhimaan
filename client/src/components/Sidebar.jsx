import React from 'react'
import { NavLink } from 'react-router-dom'
import { Protect, SignOutButton, useClerk, useUser } from '@clerk/clerk-react'

import {
  HiHome,
  HiPencil,
  HiHashtag,
  HiPhotograph,
  HiScissors,
  HiDocumentText,
  HiUserGroup
} from 'react-icons/hi';
import { CiEraser, CiLogout } from 'react-icons/ci';
import profileImg from '../assets/profile_img_1.png';

const navItems = [
  { to: '/ai', label: 'Dashboard', Icon: HiHome },
  { to: '/ai/write-article', label: 'Write Article', Icon: HiPencil },
  { to: '/ai/blog-titles', label: 'Blog Titles', Icon: HiHashtag },
  { to: '/ai/generate-images', label: 'Generate Images', Icon: HiPhotograph },
  { to: '/ai/remove-background', label: 'Remove Background', Icon: CiEraser },
  { to: '/ai/remove-object', label: 'Remove Object', Icon: HiScissors },
  { to: '/ai/review-resume', label: 'Review Resume', Icon: HiDocumentText },
  { to: '/ai/generate-website', label: 'Website Generator', Icon: HiUserGroup },
  { to: '/ai/community', label: 'Community', Icon: HiUserGroup },

]

const Sidebar = ({ sidebar, setSidebar }) => {
  const { user } = useUser();
  const { openUserProfile } = useClerk(); // ✅ added
  const userName = user?.fullName || 'User Profile';

  const isVisible = true;

  return (
    <div className=' dark h-screen  bg-gray-100 dark:bg-gray-900'>
      <div
        className={`w-60 bg-gray-100  dark:bg-gray-900 border-r border-gray flex flex-col justify-between items-center max-sm:absolute top-14 bottom-0 ${isVisible ? 'translate-x-0' : '-translate-x-full'
          } transition-transform duration-300 ease-in-out bg-gray-100 dark:bg-gray-900`}

      >
        <div className='my-7 w-full px-4'>
          {/* User Profile Section */}
          <div className="text-center mb-6">
            <img
              src={user?.imageUrl || profileImg}
              alt="User avatar"
              className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-gray-200 shadow-sm"
            />
            <h1 className="mt-2 text-center text-white font-medium text-sm">
              {userName}
            </h1>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            <div className="text-xs text-white mb-2">
              Navigation Items ({navItems.length})
            </div>
            {navItems.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/ai'}
                onClick={() => setSidebar(false)}
                className={({ isActive }) =>
                  `px-3 py-2.5 flex items-center gap-3 rounded-lg transition-all duration-200 ${isActive
                    ? 'btn-primary w-full text-white shadow-sm'
                    : 'text-white hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {Icon ? (
                      <Icon
                        className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`}
                      />
                    ) : (
                      <div className="w-5 h-5 bg-gray-300 rounded flex items-center justify-center text-xs text-gray-600">
                        {label.charAt(0)}
                      </div>
                    )}
                    <span className="font-medium text-sm">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Sign Out */}
        <div className='w-full  border-gray-200  p-4 px-7 flex items-center justify-between '>
          <div
            onClick={openUserProfile} // ✅ fixed
            className='flex gap-2 items-center cursor-pointer'
          >
            <img
              src={user?.imageUrl || profileImg}
              alt="User avatar"
              className="w-8 h-8 rounded-full object-cover"
            />
            <div>
              <h1 className='text-sm font-medium text-white'>{userName}</h1>
              <p className='text-xs text-white'>
                <Protect plan='premium' fallback="Free">Premium</Protect> Plan
              </p>
            </div>
          </div>

          {/* ✅ Proper SignOutButton usage */}
          <SignOutButton>
            <CiLogout className="cursor-pointer text-white" />
          </SignOutButton>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
