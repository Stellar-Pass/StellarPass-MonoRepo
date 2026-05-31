import React from "react";
import Link from "next/link";
import { Ticket, Github, Twitter, Globe } from "lucide-react";

const footerLinks = {
  product: [
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/#pricing" },
    { label: "Documentation", href: "/docs" },
    { label: "API", href: "/docs/api" },
  ],
  resources: [
    { label: "Blog", href: "/blog" },
    { label: "Help Center", href: "/help" },
    { label: "Community", href: "/community" },
    { label: "Status", href: "/status" },
  ],
  legal: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-stellar">
                <Ticket className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold font-display text-gray-900 dark:text-white">
                Stellar Pass
              </span>
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
              NFT-powered event ticketing on the Stellar blockchain. Secure,
              verifiable, and decentralized.
            </p>
            <div className="mt-4 flex gap-3">
              <a
                href="https://twitter.com/stellarpass"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://github.com/stellarpass"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://stellarpass.io"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
              >
                <Globe className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-4">
                {category}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-gray-200 pt-8 dark:border-gray-800">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} Stellar Pass. All rights reserved.
            </p>
            <p className="text-xs text-gray-400">
              Built on{" "}
              <a
                href="https://stellar.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-stellar-500 hover:text-stellar-600 dark:text-stellar-400 dark:hover:text-stellar-300"
              >
                Stellar
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
