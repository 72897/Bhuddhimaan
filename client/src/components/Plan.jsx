import React from 'react'
import { PricingTable } from '@clerk/clerk-react'
import gradientBackground from '../assets/pattern.png';



const Plan = () => {
  return (
   <div 
   style={{ backgroundImage: `url(${gradientBackground})` }}>

 <div className='max-w-2xl mx-auto z-20 my-30'>
      <div className='text-center'>
        <h2 className='text-primary-200 text-[42px] font-semibold'>
          Choose Your Plan
        </h2>
        <p className='text-white max-w-lg mx-auto'>
          Start for free and scale up as you grow. Find the perfect plan for your content creation needs.
        </p>
      </div>

    
        <div className='mt-14 max-sm:mx-8'>
        <PricingTable  />
      </div>
    


    </div>

   </div>



  )
}

export default Plan