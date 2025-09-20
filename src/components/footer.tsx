export default function Footer() {
  return (
    <footer className="mt-auto w-full">
      <div className="w-full px-8 py-6">
        <div className="flex flex-col items-center justify-center space-y-2 text-center border-t border-gray-800 pt-6">
          <p className="text-sm text-gray-400">
            Designed and developed by{" "}
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-blue-500 hover:from-purple-500 hover:to-blue-400 transition-all duration-300">
              xyzmani
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