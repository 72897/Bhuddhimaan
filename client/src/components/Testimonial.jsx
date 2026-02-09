import { assets } from "../assets/assets";
import gradientBackground from '../assets/pattern.png';



const Testimonial = () => {
  const testimonials = [
    {
      image: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200",
      name: "John Doe",
      title: "Marketing Director, TechCorp",
      content:
        "ContentAI has revolutionized our content workflow. The quality is outstanding, and it saves us hours weekly.",
      rating: 4,
    },
    {
      image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200",
      name: "Jane Smith",
      title: "Content Creator, TechCorp",
      content:
        "ContentAI made our content creation effortless. High-quality results, faster than ever.",
      rating: 5,
    },
    {
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200",
      name: "David Lee",
      title: "Content Writer, TechCorp",
      content:
        "It has transformed our workflow. Producing high-quality content is now a breeze.",
      rating: 4,
    },
    {
      image: "https://randomuser.me/api/portraits/women/44.jpg",
      name: "Emily Johnson",
      title: "SEO Specialist, MediaCorp",
      content: "This tool boosted our SEO content game massively!",
      rating: 5,
    },
    {
      image: "https://randomuser.me/api/portraits/men/32.jpg",
      name: "Michael Brown",
      title: "Blogger",
      content: "Super easy to use and generates awesome blogs.",
      rating: 4,
    },
    {
      image: "https://randomuser.me/api/portraits/women/12.jpg",
      name: "Sophia Davis",
      title: "Freelancer",
      content: "Helped me manage multiple clients without stress.",
      rating: 5,
    },
    {
      image: "https://randomuser.me/api/portraits/men/18.jpg",
      name: "Chris Wilson",
      title: "Startup Founder",
      content: "Saved my team hours of work weekly. Worth it.",
      rating: 5,
    },
    {
      image: "https://randomuser.me/api/portraits/women/22.jpg",
      name: "Olivia Taylor",
      title: "Copywriter",
      content: "Great AI writing support, feels natural and human.",
      rating: 4,
    },
    {
      image: "https://randomuser.me/api/portraits/men/45.jpg",
      name: "Daniel Martinez",
      title: "Content Strategist",
      content: "I recommend this tool to all my clients. Brilliant!",
      rating: 5,
    },
  ];

  return (
  <div 
    style={{ backgroundImage: `url(${gradientBackground})` }}
  >

  <div className="px-4 sm:px-20 xl:px-32 py-24 overflow-hidden hover:paused">
      <div className="text-center">
        <h2 className="text-primary-200 text-[42px] font-semibold">
          Loved by Creators
        </h2>
        <p className="text-white max-w-lg mx-auto">
          Don&apos;t just take our word for it. Here&apos;s what our users are saying.
        </p>
      </div>

      {/* Scrolling container */}
      <div className="relative mt-12 group">
        <div className="flex gap-6 animate-scroll group-hover:pause-animation">
          {/* Duplicate testimonials for infinite loop */}
          {[...testimonials, ...testimonials].map((t, index) => (
            <div
              key={index}
              className="p-6 w-[300px] flex-shrink-0 rounded-lg bg-[#FDFDFE] shadow-lg border border-gray-100"
            >
              {/* Rating */}
              <div className="flex items-center gap-1">
                {Array(5)
                  .fill(0)
                  .map((_, starIndex) => (
                    <img
                      key={starIndex}
                      src={
                        starIndex < t.rating
                          ? assets.star_icon
                          : assets.star_dull_icon
                      }
                      className="w-4 h-4"
                      alt="star"
                    />
                  ))}
              </div>

              {/* Content */}
              <p className="text-gray-500 text-sm my-4">"{t.content}"</p>
              <hr className="mb-4 border-gray-300" />

              {/* User */}
              <div className="flex items-center gap-3">
                <img
                  src={t.image}
                  className="w-12 h-12 object-cover rounded-full"
                  alt={t.name}
                />
                <div className="text-sm text-gray-600">
                  <h3 className="font-medium">{t.name}</h3>
                  <p className="text-xs text-gray-500">{t.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tailwind custom keyframes */}
      <style>
        {`
          @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-scroll {
            display: flex;
            width: max-content;
            animation: scroll 40s linear infinite;
          }
          .pause-animation {
            animation-play-state: paused;
          }
        `}
      </style>



         











    </div>


  </div>
  );
};

export default Testimonial;
