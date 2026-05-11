export default function Footer() {
  return (
    <footer className="mt-auto w-full">
      <div className="w-full px-8 py-6">
        <div className="flex flex-col items-center justify-center border-t border-gray-800 pt-6 text-center">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
