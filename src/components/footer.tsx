export default function Footer() {
  return (
    <footer className="mt-auto w-full">
      <div className="w-full px-8 py-6">
        <div className="flex flex-col items-center justify-center space-y-2 border-t border-gray-800 pt-6 text-center">
          <p className="text-sm text-gray-400">
            {`Designed by`}
            <span className="bg-gradient-to-r from-blue-200 to-blue-500 bg-clip-text font-semibold text-transparent transition-all duration-300 hover:from-purple-500 hover:to-blue-400">
              {` luvhummers`}
            </span>
            {` & developed by`}
            <span className="bg-gradient-to-r from-blue-200 to-blue-500 bg-clip-text font-semibold text-transparent transition-all duration-300 hover:from-purple-500 hover:to-blue-400">
              {` xyzmani`}
            </span>
          </p>
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
