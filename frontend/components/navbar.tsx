import React from 'react';
import Link from 'next/link';
import * as NavigationMenu from '@radix-ui/react-navigation-menu';

const NavBar = () => {
  return (
    <NavigationMenu.Root className="bg-gray-800">
      <NavigationMenu.List className="flex items-center justify-between p-4">
        {/* Logo */}
        <NavigationMenu.Item>
          <NavigationMenu.Link asChild>
            <Link href="/"  className="text-white font-bold text-xl hover:text-gray-300 transition-colors"> 
              Logo
            </Link>
          </NavigationMenu.Link>
        </NavigationMenu.Item>


        {/* Navigation links */}
        <NavigationMenu.Item>
          <NavigationMenu.List className="flex gap-6">

            <NavigationMenu.Item>
              <NavigationMenu.Link asChild>
                <Link href="/about"  className="text-white hover:text-gray-300 transition-colors">
                  About
                </Link>
              </NavigationMenu.Link>
            </NavigationMenu.Item>

            <NavigationMenu.Item>
              <NavigationMenu.Link asChild>
                <Link href="/services"  className="text-white hover:text-gray-300 transition-colors">
                  Services
                </Link>
              </NavigationMenu.Link>
            </NavigationMenu.Item>

            <NavigationMenu.Item>
              <NavigationMenu.Link asChild>
                <Link href="/services"  className="text-white hover:text-gray-300 transition-colors">
                  Contact
                </Link>
              </NavigationMenu.Link>
            </NavigationMenu.Item>


          </NavigationMenu.List>
        </NavigationMenu.Item>
      </NavigationMenu.List>
    </NavigationMenu.Root>
  );
};

export default NavBar;
