import React from 'react'
import { assets } from '../assets/assets'
import { Button } from './ui/button'
import gradientBackground from '../assets/pattern.png';
import Card from './share';
import logo from '../assets/logo1.png'

const Footer = () => {
  return (
  <div
    style={{ backgroundImage: `url(${gradientBackground})` }}
  >


  <footer className="px-6 md:px-16 lg:px-24 xl:px-32 pt-12 w-full  text-gray-700 mt-20 border-t border-gray-300  bg-gray-100 dark:bg-gray-900">
      
      {/* Top Section */}
      <div className="flex flex-col md:flex-row justify-between w-full gap-12 border-b border-gradient-to-r from-indigo-300 via-transparent to-indigo-300 pb-10">
        
        {/* Logo & Description */}
        <div className="md:max-w-sm">
          <img 
            className="h-22"
            w-32 
            src={logo} 
            alt="Logo" 
          />
          <p className="mt-1 text-sm leading-relaxed text-white">
            Experience the power of AI with <strong className="text-indigo-600">Buddhimaan</strong>.<br />
            Your intelligent digital companion.
          </p>
        </div>

        {/* Links & Newsletter */}
        <div className="flex-1 flex flex-col sm:flex-row justify-between gap-10">
          
          {/* Company Links */}
          <div>
            <h2 className="font-semibold text-primary mb-4">Company</h2>
            <ul className="text-sm space-y-2 text-white">
              {["Home", "About us", "Contact us", "Privacy policy"].map((item, i) => (
                <li key={i}>
                  <a 
                    href="#" 
                    className="hover:text-indigo-600 transition-colors duration-200"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>


          <div>
            <Card/>
          </div>

          {/* Newsletter */}
          <div className="max-w-md">
            <h2 className="font-semibold text-primary mb-4">Subscribe to our newsletter</h2>
            <p className="text-sm mb-4 text-white">
              Get the latest news, articles, and resources, sent weekly to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input 
                className="border border-gray-300 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:max-w-xs h-10 rounded-md px-3 text-sm transition-all duration-200" 
                type="email" 
                placeholder="Enter your email" 
              />
              <Button className="btn-primary w-full sm:w-auto h-10 px-6 transition-all duration-200">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <p className="pt-6 text-center text-xs md:text-sm text-white  pb-6">
        © 2025 <span className="text-indigo-600 font-semibold">Buddhimaan</span>. All rights reserved.
      </p>
    </footer>



  </div>
  )
}

export default Footer
