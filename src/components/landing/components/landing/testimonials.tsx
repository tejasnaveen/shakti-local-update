
const reviews = [
  {
    quote: "Recovery rates went up by 35% in just two months. The gamification actually keeps the team motivated.",
    author: "Rahul Sharma",
    role: "Collection Head, FinTech One",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul"
  },
  {
    quote: "Finally, a CRM that doesn't feel like a spreadsheet from 1990. My agents love the UI.",
    author: "Priya Mehta",
    role: "Director, Mehta Agencies",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya"
  },
  {
    quote: "The automated allocation saved us 2 hours of manual work every single morning.",
    author: "Amit Verma",
    role: "Ops Manager, Swift Loans",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Amit"
  },
  {
    quote: "Support is fantastic. They helped us integrate with our LMS in less than a week.",
    author: "Sneha Reddy",
    role: "CTO, CreditFlow",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha"
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-4 mb-16 text-center">
        <h2 className="text-4xl font-display font-bold mb-6 text-gray-900">
          Trusted by India's Leading Collection Agencies
        </h2>
      </div>

      {/* Marquee Effect */}
      <div className="relative flex overflow-hidden group">
        <div className="flex animate-marquee space-x-8 whitespace-nowrap py-4">
          {[...reviews, ...reviews].map((review, index) => (
            <div
              key={index}
              className="w-[400px] bg-white p-8 rounded-2xl shadow-lg border border-gray-100 flex-shrink-0 mx-4 hover:border-brand-purple/30 transition-colors"
            >
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 text-lg mb-6 whitespace-normal leading-relaxed">
                "{review.quote}"
              </p>
              <div className="flex items-center gap-4">
                <img src={review.avatar} alt={review.author} className="w-12 h-12 rounded-full bg-gray-100" />
                <div>
                  <p className="font-bold text-gray-900">{review.author}</p>
                  <p className="text-sm text-gray-500">{review.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="absolute top-0 bottom-0 left-0 w-32 bg-gradient-to-r from-white to-transparent z-10"></div>
        <div className="absolute top-0 bottom-0 right-0 w-32 bg-gradient-to-l from-white to-transparent z-10"></div>
      </div>
    </section>
  );
}
