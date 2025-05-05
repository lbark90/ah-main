import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <header className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-light">AliveHere<span className="text-blue-400">.com</span></h1>
          <nav>
            <ul className="flex space-x-6">
              <li><a href="#how-it-works" className="hover:text-blue-400 transition-colors">How It Works</a></li>
              <li><a href="#about" className="hover:text-blue-400 transition-colors">About</a></li>
              <li><Link href="/login" className="text-white hover:text-blue-400 transition-colors">Login</Link></li>
              <li><Link href="/registration" className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-md transition-colors">Get Started</Link></li>
            </ul>
          </nav>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-20 flex flex-col items-center text-center">
          <h2 className="text-5xl font-light mb-6">Preserve Your Voice, Share Your Story</h2>
          <p className="text-xl text-slate-300 max-w-3xl mb-10">
            Create a digital legacy that allows your loved ones to have meaningful conversations with you long after you're gone.
          </p>
          <Link href="/registration" className="bg-blue-500 hover:bg-blue-600 px-8 py-3 rounded-md text-lg transition-colors">
            Begin Your Legacy
          </Link>

          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl">
            <div className="bg-slate-800/50 p-8 rounded-lg border border-slate-700">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="text-xl mb-3">Record Your Story</h3>
              <p className="text-slate-400">Answer thoughtful questions about your life, experiences, and wisdom in your own voice.</p>
            </div>

            <div className="bg-slate-800/50 p-8 rounded-lg border border-slate-700">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl mb-3">AI Voice Creation</h3>
              <p className="text-slate-400">Our technology creates a perfect digital replica of your voice and personality.</p>
            </div>

            <div className="bg-slate-800/50 p-8 rounded-lg border border-slate-700">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <h3 className="text-xl mb-3">Meaningful Conversations</h3>
              <p className="text-slate-400">Your loved ones can have natural, interactive conversations with your digital presence.</p>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="bg-slate-950/50 py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-light mb-16 text-center">How It Works</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div>
                <h3 className="text-2xl mb-4 font-light">Simple Registration</h3>
                <p className="text-slate-300 mb-6">
                  Begin with basic information - your name and contact details. This takes less than a minute to complete.
                </p>
                <h3 className="text-2xl mb-4 font-light">Guided Interview Process</h3>
                <p className="text-slate-300 mb-6">
                  Our AI guide will ask you thoughtful questions one at a time. You can respond naturally in your own voice,
                  with the freedom to pause and continue at your convenience.
                </p>
                <h3 className="text-2xl mb-4 font-light">Voice Cloning Technology</h3>
                <p className="text-slate-300">
                  Using advanced AI, we create a digital voice that perfectly matches yours, capturing your unique speech patterns and personality.
                </p>
              </div>

              <div className="bg-slate-800/30 p-8 rounded-lg border border-slate-700 relative">
                <div className="absolute -top-6 -right-6 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-xl font-bold">1</div>
                <h4 className="text-xl mb-3">Register</h4>
                <p className="text-slate-400 mb-6">Enter your name and contact information to create your account.</p>

                <div className="absolute -top-6 left-1/3 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-xl font-bold">2</div>
                <h4 className="text-xl mb-3 mt-12">Record</h4>
                <p className="text-slate-400 mb-6">Answer questions about your life, experiences, and wisdom in your own voice.</p>

                <div className="absolute -top-6 left-2/3 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-xl font-bold">3</div>
                <h4 className="text-xl mb-3 mt-12">Share</h4>
                <p className="text-slate-400">Provide access to loved ones who can have conversations with your digital presence.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-light mb-6">Our Mission</h2>
            <p className="text-xl text-slate-300 mb-10">
              At AliveHere, we believe that every life story deserves to be preserved and shared. Our mission is to help people create meaningful digital legacies
              that allow their wisdom, memories, and personality to remain accessible to loved ones for generations to come.
            </p>
            <p className="text-slate-400">
              We've created a compassionate, ethical platform that respects the profound nature of preserving someone's essence while making the process
              simple and accessible to everyone. Your privacy and dignity are our highest priorities.
            </p>
          </div>
        </section>
      </main>

      <footer className="bg-slate-950 py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h2 className="text-2xl font-light">AliveHere<span className="text-blue-400">.com</span></h2>
              <p className="text-slate-400 mt-2">Preserve your voice. Share your story.</p>
            </div>

            <div>
              <Link href="/registration" className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-md transition-colors">
                Begin Your Legacy
              </Link>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-10 pt-10 text-center text-slate-500">
            <p>&copy; {new Date().getFullYear()} AliveHere. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
