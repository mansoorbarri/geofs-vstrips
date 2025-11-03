import Link from 'next/link';

export default function Header() {
  return (
    <header className="w-full border-b border-gray-800">
      <div className="w-full py-2">
        <nav className="flex items-center justify-center space-x-5 text-md">
          <Link
            href="/"
            className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-blue-500 hover:from-purple-500 hover:to-blue-400 transition-all duration-300"
          >
            Boards
          </Link>
          <Link
            href="/file-flight"
            className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-blue-500 hover:from-purple-500 hover:to-blue-400 transition-all duration-300"
          >
            File Flight
          </Link>
          <Link
            href="/edit-flight"
            className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-blue-500 hover:from-purple-500 hover:to-blue-400 transition-all duration-300"
          >
            Edit Flight
          </Link>
          <Link
            href="/admin"
            className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-blue-500 hover:from-purple-500 hover:to-blue-400 transition-all duration-300"
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}