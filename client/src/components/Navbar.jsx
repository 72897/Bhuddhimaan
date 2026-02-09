import React from 'react'
import { useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'
import { HiArrowRight } from 'react-icons/hi'
import { useClerk, UserButton, useUser } from '@clerk/clerk-react'
import { Button } from './ui/button'
import logo from '../assets/logo1.png'

const Navbar = () => {
  const navigate = useNavigate()
  const { user } = useUser()
  const { openSignIn } = useClerk()

  return (
    <div className='fixed z-5 w-full backdrop-2xl flex justify-between 
    items-center py-3 px-4 sm:px-20 xl:px-32 cursor-pointer'>
      <img src={logo} alt="logo" className='w-12 h-20  sm:w-44 cursor-pointer' onClick={() => navigate('/')} />
      {
        user ? (
          <UserButton className="w-30 h-30" />
        ) : (
          <Button onClick={openSignIn} className='btn-primary max-sm:w-full'>Get started <HiArrowRight className='w-4 h-4' /></Button>

        )
      }


    </div>
  )
}

export default Navbar         