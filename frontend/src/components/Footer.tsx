import React from 'react';
import Link from 'next/link';

export const Footer = () => {
  return (
    <footer className="bg-base-200 py-8 border-t border-base-300 mt-auto">
      <div className="max-w-lg mx-auto px-4 flex flex-col items-center gap-6 text-center">
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm font-medium opacity-80">
          <Link href="/terms" className="hover:text-primary transition-colors">Terms & Conditions</Link>
          <Link href="/terms#refund-policy" className="hover:text-primary transition-colors">Refund Policy</Link>
          <Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link>
          <Link href="/about" className="hover:text-primary transition-colors">About Us</Link>
          <Link href="/media" className="hover:text-primary transition-colors">Media</Link>
        </div>
        <p className="text-xs opacity-50">
          &copy; {new Date().getFullYear()} Sravi Enterprises. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
