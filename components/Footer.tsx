import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-white/8 py-6 sm:py-9 mt-12 sm:mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
          <div className="flex flex-wrap justify-center sm:justify-start gap-4 sm:gap-8">
            <Link href="#" className="text-xs text-gray-400 hover:text-white uppercase tracking-wider transition-colors">
              Contract
            </Link>
            <Link href="#" className="text-xs text-gray-400 hover:text-white uppercase tracking-wider transition-colors">
              Docs
            </Link>
            <Link href="#" className="text-xs text-gray-400 hover:text-white uppercase tracking-wider transition-colors">
              Support
            </Link>
            <Link href="#" className="text-xs text-gray-400 hover:text-white uppercase tracking-wider transition-colors">
              Twitter
            </Link>
          </div>
          <div className="text-xs text-gray-400">
            © 2026 MassiveHikeCoin
          </div>
        </div>
      </div>
    </footer>
  );
}
