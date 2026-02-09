import React from 'react';
import gradientBackground from '../assets/pattern.png';
import { useNavigate } from 'react-router-dom';
import { assets } from '../assets/assets';
import { Button } from './ui/button';
import Loader from './globe';

const Hero = () => {
  const navigate = useNavigate()
  return (
    <div
      style={{ backgroundImage: `url(${gradientBackground})` }}
      className="px-4 sm:px-20 xl:px-32 relative inline-flex flex-col w-full
      justify-center bg-cover bg-repeat-y min-h-screen"
    >
      <div className="text-center mb-6 -mt-28">

        <h1 className="text-3xl sm:text-5xl md:text-6xl 2xl:text-7xl
        font-semibold mx-auto leading-[1.2] text-white">Create or ask anything with<br /> with <span className=' text-primary-200'>Buddhimaan</span></h1>
        <p className='mt-4 max-w-xs sm:max-w-lg 2xl:max-w-xl m-auto
        max-sm:text-xs text-white'>
          Transform your content creation with our suite of premium AI tools.
          Write articles, generate images, and enhance your workflow.
        </p>
      </div>

      <div className='flex flex-wrap justify-center gap-4 text-sm:text-xs'>
        <Button onClick={() => navigate('/ai')} className='btn-primary max-sm:w-full'>Start creating now</Button>
        <button className='border border-white text-white py-2 px-4 rounded-md cursor-pointer transition-all duration-200 hover:shadow-2xl'>
  <a 
    href="https://www.youtube.com/watch?v=nVY5ianV-DI" 
    target="_blank" 
    rel="noopener noreferrer"
  >
    Watch Demo
  </a>
</button>

      </div>


      <div className='flex items-center gap-4 mt-8 mx-auto text-white'>
        <img src={assets.user_group} alt="" className='h-8 ' /> Trusted by many
      </div>


     <div className='mx-auto mt-10 -mb-40'>
       <Loader />
     </div>

    </div>
  );
};

export default Hero;
