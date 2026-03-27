export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <a className="flex items-center gap-2 mb-4 group" href="#">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white group-hover:rotate-6 transition-transform">
                <span className="material-symbols-outlined">storefront</span>
              </div>
              <span className="text-xl font-bold text-[#0d1b12]">Mollmart</span>
            </a>
            <p className="text-sm text-gray-500">
              Connecting buyers and sellers through intelligent, personalized discovery.
            </p>
            <div className="mt-6 flex space-x-4">
              <a className="text-gray-400 hover:text-primary transition-colors hover:scale-110" href="#">
                <span className="sr-only">Facebook</span>
                <svg
                  aria-hidden="true"
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    clipRule="evenodd"
                    d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                    fillRule="evenodd"
                  />
                </svg>
              </a>
              <a className="text-gray-400 hover:text-primary transition-colors hover:scale-110" href="#">
                <span className="sr-only">Twitter</span>
                <svg
                  aria-hidden="true"
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
            </div>
          </div>

          <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-8">
            <div>
              <h3 className="text-sm font-semibold leading-6 text-[#0d1b12]">Shop</h3>
              <ul className="mt-4 space-y-3" role="list">
                <li>
                  <a className="text-sm leading-6 text-gray-500 hover:text-primary transition-colors" href="#">
                    New Arrivals
                  </a>
                </li>
                <li>
                  <a className="text-sm leading-6 text-gray-500 hover:text-primary transition-colors" href="#">
                    Featured
                  </a>
                </li>
                <li>
                  <a className="text-sm leading-6 text-gray-500 hover:text-primary transition-colors" href="#">
                    Categories
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold leading-6 text-[#0d1b12]">Sell</h3>
              <ul className="mt-4 space-y-3" role="list">
                <li>
                  <a className="text-sm leading-6 text-gray-500 hover:text-primary transition-colors" href="#">
                    Start Selling
                  </a>
                </li>
                <li>
                  <a className="text-sm leading-6 text-gray-500 hover:text-primary transition-colors" href="#">
                    Check Demand
                  </a>
                </li>
                <li>
                  <a className="text-sm leading-6 text-gray-500 hover:text-primary transition-colors" href="#">
                    Seller Handbook
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold leading-6 text-[#0d1b12]">Support</h3>
              <ul className="mt-4 space-y-3" role="list">
                <li>
                  <a className="text-sm leading-6 text-gray-500 hover:text-primary transition-colors" href="#">
                    Help Center
                  </a>
                </li>
                <li>
                  <a className="text-sm leading-6 text-gray-500 hover:text-primary transition-colors" href="#">
                    Safety &amp; Trust
                  </a>
                </li>
                <li>
                  <a className="text-sm leading-6 text-gray-500 hover:text-primary transition-colors" href="#">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold leading-6 text-[#0d1b12]">Legal</h3>
              <ul className="mt-4 space-y-3" role="list">
                <li>
                  <a className="text-sm leading-6 text-gray-500 hover:text-primary transition-colors" href="#">
                    Privacy
                  </a>
                </li>
                <li>
                  <a className="text-sm leading-6 text-gray-500 hover:text-primary transition-colors" href="#">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-100 pt-8">
          <p className="text-xs text-gray-500">© 2024 Mollmart Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

