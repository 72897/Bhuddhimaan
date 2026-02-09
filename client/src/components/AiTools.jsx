import React from 'react';
import { AiToolsData } from '../assets/assets';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import gradientBackground from '../assets/pattern.png';
import { IconCloud } from "../components/ui/icon-cloud";


const images = [


  // Previous 20
  "https://images.unsplash.com/photo-1518773553398-650c184e0bb3?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1535223289827-42f1e9919769?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1503424886309-2e6ee5a7a38f?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1504805572947-34fad45aed93?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1518773553398-650c184e0bb3?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1535223289827-42f1e9919769?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1503424886309-2e6ee5a7a38f?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1518773553398-650c184e0bb3?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1535223289827-42f1e9919769?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1974&auto=format&fit=crop",

  // 40 new images
  "https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519389950473-12f2078b3f19?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517433456452-f9633a875f6f?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1506765515384-028b60a970df?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1518933165971-611dbc9c412d?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1496317556649-f930d733eea2?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519389950473-12f2078b3f19?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1496317556649-f930d733eea2?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519389950473-12f2078b3f19?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1496317556649-f930d733eea2?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519389950473-12f2078b3f19?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1974&auto=format&fit=crop"
];





const AiTools = () => {
  const navigate = useNavigate();
  const { user } = useUser();

  return (
   <div 
   style={{ backgroundImage: `url(${gradientBackground})` }}
   >

 <div className="px-4 sm:px-10 xl:px-24 2xl:px-28 my-24">
      {/* Section Header */}
      <div className="text-center mb-16 mx-auto">
        <h2 className="text-primary-200 text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mx-auto">
          Powerful AI Tools at Your Fingertips
        </h2>
        <p className="text-white mt-4 max-w-2xl mx-auto text-base sm:text-lg">
          Everything you need to create, enhance, and optimize your content with cutting-edge AI technology.
        </p>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
        {AiToolsData.map((tool, index) => {
          const seed = Math.random().toString();

          return (
            <div
              key={index}
              onClick={() => user && navigate(tool.path)}
              className="w-[360px] max-sm:w-full min-h-46 bg-white rounded-xl border border-gray-100 shadow-lg hover:shadow-2xl transition-transform transform hover:scale-110 cursor-pointer p-6 flex flex-col items-start"
            >
              {/* Tool Avatar */}
              <img
                src={`https://api.dicebear.com/7.x/adventurer/svg?seed=ai-${seed}`}
                alt="tool avatar"
                width={90}
                height={90}
                className="rounded-full object-cover mb-4"
              />

              {/* Tool Title */}
              <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2">{tool.title}</h3>

              {/* Badge / Type (optional) */}
              {tool.badge && (
                <p className="badge-text mb-3 px-2 py-1 rounded-full bg-light-600 text-sm">
                  {tool.badge}
                </p>
              )}

              {/* Tool Description */}
              <p className="text-gray-500 text-sm line-clamp-3 mb-5">{tool.description}</p>

              {/* Optional footer avatars or stats */}
              {tool.team && (
                <div className="flex -space-x-3 mb-4">
                  {tool.team.map((member, idx) => (
                    <img
                      key={idx}
                      src={member.avatar}
                      alt={member.name}
                      width={40}
                      height={40}
                      className="rounded-full bg-white border border-gray-300 shadow hover:shadow-lg transition-transform transform hover:scale-110"
                    />
                  ))}
                </div>
              )}

              {/* Button */}
              <button className="btn-primary mt-auto w-full text-center">
                {tool.actionText || 'Use Tool'}
              </button>
            </div>
          );
        })}
      </div>
    </div>



     <div className="relative flex size-full max-w-lg items-center justify-center w-full overflow-hidden rounded-lg  bg-transparent p-1 mx-auto -m-30 ">
      <IconCloud images={images}  />
    </div>

   </div>
  );
};

export default AiTools;
