import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-6">
          Welcome to PlaceMate.AI
        </h1>
        <p className="text-xl text-gray-600 mb-10">
          Your AI-powered placement assistant. Prepare for technical and HR interviews, practice coding, and take timed aptitude assessments to get ready for your dream job.
        </p>
        
        <div className="flex gap-4 justify-center">
          <Link href="/signup">
            <button className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg">
              Get Started
            </button>
          </Link>
          <Link href="/login">
            <button className="px-8 py-3 bg-white text-gray-900 font-bold rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm">
              Log In
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
