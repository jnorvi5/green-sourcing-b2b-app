import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="relative bg-white dark:bg-gray-900 pt-32 pb-16 lg:pt-40 lg:pb-24 overflow-hidden">
      <div className="max-w-screen-xl px-4 mx-auto lg:px-6 relative z-10">
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: The Value Prop */}
          <div className="lg:col-span-7 text-center lg:text-left">
            <h1 className="max-w-2xl mb-6 text-4xl font-extrabold tracking-tight leading-none md:text-5xl xl:text-6xl dark:text-white">
              De-risk Your <span className="text-gradient">Sustainable Sourcing.</span>
            </h1>
            <p className="max-w-2xl mb-8 font-light text-gray-500 lg:mb-10 md:text-lg lg:text-xl dark:text-gray-400 mx-auto lg:mx-0">
              The first B2B marketplace bridging the gap between Green Building standards and verifiable supply chain data. Stop guessing. Start building.
            </p>
            <div className="flex flex-col space-y-4 sm:flex-row sm:justify-center lg:justify-start sm:space-y-0 sm:space-x-4">
              <Link to="/sourcing" className="btn-primary inline-flex items-center justify-center text-base text-center">
                Start Sourcing
                <svg className="w-5 h-5 ml-2 -mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
              </Link>
              <Link to="/suppliers" className="btn-secondary inline-flex items-center justify-center text-base text-center border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 dark:text-white dark:border-gray-700 dark:hover:bg-gray-700 dark:focus:ring-gray-800">
                List Your Products
              </Link>
            </div>
          </div>
          {/* Right Column: The Visual Hook */}
          <div className="hidden lg:mt-0 lg:col-span-5 lg:flex relative animate-float">
            <img 
              src="/assets/hero-visual.png" 
              alt="Green Sourcing Dashboard Mockup"
              width={600} 
              height={600}
              className="relative z-10 rounded-2xl shadow-2xl hover-glow"
              loading="lazy"
            />
            {/* Decorative Background Blobs */}
            <div className="absolute top-0 -right-10 -z-10 w-72 h-72 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute -bottom-10 -left-10 -z-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
