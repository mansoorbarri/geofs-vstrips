import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full border-b border-gray-800">
      <div className="w-full py-2">
        <nav className="text-md flex items-center justify-center space-x-5">
          <Link
            href="/"
            className="bg-gradient-to-r from-blue-200 to-blue-500 bg-clip-text font-semibold text-transparent transition-all duration-300 hover:from-purple-500 hover:to-blue-400"
          >
            Boards
          </Link>
          <Link
            href="/file-flight"
            className="bg-gradient-to-r from-blue-200 to-blue-500 bg-clip-text font-semibold text-transparent transition-all duration-300 hover:from-purple-500 hover:to-blue-400"
          >
            File Flight
          </Link>
          <Link
            href="/edit-flight"
            className="bg-gradient-to-r from-blue-200 to-blue-500 bg-clip-text font-semibold text-transparent transition-all duration-300 hover:from-purple-500 hover:to-blue-400"
          >
            Edit Flight
          </Link>
          <Link
            href="/admin"
            className="bg-gradient-to-r from-blue-200 to-blue-500 bg-clip-text font-semibold text-transparent transition-all duration-300 hover:from-purple-500 hover:to-blue-400"
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
