// components/Footer.tsx
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white rounded-lg shadow sm:flex sm:items-center sm:justify-between p-4 sm:p-6 xl:p-8 dark:bg-gray-800 antialiased -mt-6">
      <div className="flex justify-end w-full">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-0 text-right">
          &copy; 2025{' '}
          <a
            href="https://iphonik.com/"
            className="hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            iphonik.com
          </a>. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
