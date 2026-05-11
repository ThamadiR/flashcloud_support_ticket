import { useEffect, useState } from "react";
import FlashLogo from "../../assets/assets/logo.png";
import { Link } from "react-router-dom";
import React from "react";
import { useDrawer } from "../../context/DrawerContext";
import { useTheme } from "../../context/ThemeContext";
import "flowbite";
import { useNavigate } from "react-router-dom";
import { Dropdown } from "flowbite";
import "flowbite/dist/flowbite.min.js";
import {
  LayoutDashboard,
  Ticket,
  Users,
  Building2,
  Key,
  Server,
  Settings,
  HelpCircle,
  PlusCircle
} from 'lucide-react';
//import { FaUserPlus, FaUserCog } from "react-icons/fa";
//import { Button } from "flowbite-react";

const Bars3Icon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    aria-hidden="true"
    {...props}
    fill="currentColor"
    viewBox="0 0 20 20"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
      clipRule="evenodd"
    ></path>
  </svg>
);

const Header: React.FC = () => {


  const { isDark, toggleTheme } = useTheme();

  const [showAdminDropdown, setShowAdminDropdown] = useState(false);

  //const [collapsed, setCollapsed] = useState(false);
  const { isDrawerOpen, setIsDrawerOpen } = useDrawer();

  const user = (() => {
    try {
      const item = localStorage.getItem("user");
      if (!item || item === "undefined") return {};
      return JSON.parse(item);
    } catch {
      return {};
    }
  })();

  const initials = `${user?.firstName?.charAt(0) || user?.fname?.charAt(0) || ""}${user?.lastName?.charAt(0) || user?.lname?.charAt(0) || ""
    }`.toUpperCase();

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  useEffect(() => {
    try {
      new Dropdown(
        document.getElementById("dropdown-menu"),
        document.getElementById("user-menu-button")
      );
    } catch {
      // Flowbite Dropdown elements not present on this page, safe to ignore
    }
  }, []);

  const profileImage = user?.img || user?.avatarUrl;

  return (
    <div className="antialiased bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white border-b border-gray-200 px-4 h-14 dark:bg-gray-800 dark:border-gray-700 fixed left-0 right-0 top-0 z-50 flex items-center">
        <div className="flex flex-wrap justify-between items-center w-full">
          <div className="flex justify-start items-center">
            {/* Hamburger Button */}
            <button
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              className="
                absolute 
                top-4 left-1 
                z-50  
                p-2
                hover:scale-105 transition
              "
            >
              <Bars3Icon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>

            <a
              href="/"
              className="flex items-center justify-between mr-4"
            >
              <img
                src={FlashLogo}
                className="mr-3 h-10 ml-7"
                alt="Flashcloud Logo"
              />
            </a>

          </div>

          <div className="flex items-center lg:order-2">


            <button
              type="button"
              data-dropdown-toggle="notification-dropdown"
              className="p-2 mr-1 text-gray-500 rounded-lg hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
            >
              <span className="sr-only">View notifications</span>

              <svg
                aria-hidden="true"
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"></path>
              </svg>
            </button>

            <div
              className="hidden overflow-hidden z-50 my-4 max-w-sm text-base list-none bg-white rounded divide-y divide-gray-100 shadow-lg dark:divide-gray-600 dark:bg-gray-700 rounded-xl"
              id="notification-dropdown"
            >
              <div className="block py-2 px-4 text-base font-medium text-center text-gray-700 bg-gray-50 dark:bg-gray-600 dark:text-gray-300">
                Notifications
              </div>
              <div>
                <a
                  href="#"
                  className="flex py-3 px-4 border-b hover:bg-gray-100 dark:hover:bg-gray-600 dark:border-gray-600"
                >
                  <div className="flex-shrink-0">
                    <img
                      className="w-11 h-11 rounded-full"
                      src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/avatars/bonnie-green.png"
                      alt="Support Agent Avatar"
                    />
                    <div className="flex absolute justify-center items-center ml-6 -mt-5 w-5 h-5 rounded-full border border-white bg-yellow-500 dark:border-gray-700">
                      <svg
                        aria-hidden="true"
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M8.257 3.099c.366-.446.958-.446 1.324 0l6 7.315c.397.485.06 1.186-.662 1.186H3.595c-.722 0-1.059-.701-.662-1.186l6-7.315zM11 13a1 1 0 11-2 0 1 1 0 012 0z" />
                      </svg>
                    </div>
                  </div>
                  {/* <div className="pl-3 w-full">
                    <div className="text-gray-500 font-normal text-sm mb-1.5 dark:text-gray-400">
                      New ticket submitted by
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {" "}
                        Akila Kavinda
                      </span>
                      : "Issue with logging in."
                    </div>
                    <div className="text-xs font-medium text-primary-600 dark:text-primary-500">
                      Just now
                    </div>
                  </div> */}
                </a>
              </div>

              <a
                href="#"
                className="block py-2 text-md font-medium text-center text-gray-900 bg-gray-50 hover:bg-gray-100 dark:bg-gray-600 dark:text-white dark:hover:underline"
              >
                <div className="inline-flex items-center">
                  <svg
                    aria-hidden="true"
                    className="mr-2 w-4 h-4 text-gray-500 dark:text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                    <path
                      fill-rule="evenodd"
                      d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                  View all
                </div>
              </a>
            </div>

            <button
              type="button"
              className="flex mx-3 text-sm bg-gray-800 rounded-full md:mr-0 focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600 overflow-hidden"
              id="user-menu-button"
              data-dropdown-toggle="dropdown-menu"
            >
              <span className="sr-only">Open user menu</span>
              {profileImage ? (
                <img
                  className="w-8 h-8 rounded-full object-cover"
                  src={profileImage}
                  alt={`${user?.firstName || user?.fname} ${user?.lastName || user?.lname}`}
                />
              ) : (
                <div
                  className="w-8 h-8 flex items-center justify-center 
                    bg-indigo-600 text-white rounded-full 
                    font-semibold text-sm"
                >
                  {initials}
                </div>
              )}
            </button>

            <div
              className="hidden z-50 my-4 w-64 text-base list-none bg-white rounded-2xl divide-y divide-gray-100 shadow-2xl dark:bg-[#111318] dark:divide-white/10 border dark:border-white/10"
              id="dropdown-menu"
            >
              <div className="py-4 px-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-shrink-0">
                    {profileImage ? (
                      <img
                        className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500/20"
                        src={profileImage}
                        alt="User"
                      />
                    ) : (
                      <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full font-bold text-sm shadow-lg shadow-indigo-500/20">
                        {initials}
                      </div>
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <span className="block text-sm font-bold text-gray-900 dark:text-white truncate">
                      {user?.firstName || user?.fname} {user?.lastName || user?.lname}
                    </span>
                    <span className="block text-xs font-medium text-gray-500 dark:text-slate-400 truncate">
                      {user?.email}
                    </span>
                  </div>
                </div>
              </div>
              <ul
                className="py-1 text-gray-700 dark:text-gray-300"
                aria-labelledby="dropdown-menu"
              >
                <li>
                  <Link
                    to="/profile"
                    className="block py-2 px-4 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-400 dark:hover:text-white cursor-pointer"
                  >
                    My profile
                  </Link>
                </li>
              </ul>
              <ul
                className="py-1 text-gray-700 dark:text-gray-300"
                aria-labelledby="dropdown-menu"
              >
                <li>
                  {/*<a
                    href="#"
                    className="block py-2 px-4 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                  >
                    Sign out
                  </a>*/}
                  <a
                    onClick={handleLogout}
                    className="block py-2 px-4 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-red-400 cursor-pointer"
                  >
                    Sign out
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>

      <aside
        className={`fixed top-14 left-0 z-40 h-[calc(100vh-56px)]
              transition-all duration-300 bg-white dark:bg-gray-800 
              border-r border-gray-200 dark:border-gray-700
              ${isDrawerOpen ? "w-64" : "w-20"}
            `}
        id="drawer-navigation"
      >
        <div className="overflow-y-auto pt-12 pb-6 px-4 h-full">

          <ul className="space-y-2">
            <li>
              <Link
                to="/dashboard"
                className="flex items-center p-2 text-[0.875rem] font-medium text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
              >
                <LayoutDashboard className="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                <span
                  className={`ml-3 whitespace-nowrap transition-all duration-300 
                              ${!isDrawerOpen
                      ? "opacity-0 hidden"
                      : "opacity-100 block"
                    }
                            `}
                >
                  Dashboard
                </span>
              </Link>
            </li>
            <li>
              <Link
                to="/tickets"
                className="flex items-center p-2 w-full text-[0.875rem] font-medium text-gray-900 rounded-lg transition duration-75 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
              >
                <Ticket className="flex-shrink-0 w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white" />
                <span
                  className={`ml-3 whitespace-nowrap transition-all duration-300 
                              ${!isDrawerOpen
                      ? "opacity-0 hidden"
                      : "opacity-100 block"
                    }
                            `}
                >
                  Tickets
                </span>
              </Link>
            </li>
            <li>
              <Link
                to="/contacts"
                className="flex items-center p-2 w-full text-[0.875rem] font-medium text-gray-900 rounded-lg transition duration-75 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
              >
                <Users className="flex-shrink-0 w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white" />
                <span
                  className={`ml-3 whitespace-nowrap transition-all duration-300 
                              ${!isDrawerOpen
                      ? "opacity-0 hidden"
                      : "opacity-100 block"
                    }
                            `}
                >
                  Contacts
                </span>
              </Link>
            </li>
            <li>
              <Link
                to="/companies"
                className="flex items-center p-2 w-full text-[0.875rem] font-medium text-gray-900 rounded-lg transition duration-75 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
              >
                <Building2 className="flex-shrink-0 w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white" />
                <span
                  className={`ml-3 whitespace-nowrap transition-all duration-300 
                              ${!isDrawerOpen
                      ? "opacity-0 hidden"
                      : "opacity-100 block"
                    }
                            `}
                >
                  Companies
                </span>
              </Link>
            </li>
            <li>
              <Link
                to="/tenants"
                className="flex items-center p-2 w-full text-[0.875rem] font-medium text-gray-900 rounded-lg transition duration-75 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
              >
                <Key className="flex-shrink-0 w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white" />
                <span
                  className={`ml-3 whitespace-nowrap transition-all duration-300 
                              ${!isDrawerOpen
                      ? "opacity-0 hidden"
                      : "opacity-100 block"
                    }
                            `}
                >
                  Tenants
                </span>
              </Link>
            </li>
            <li>
              <Link
                to="/servers"
                className="flex items-center p-2 w-full text-[0.875rem] font-medium text-gray-900 rounded-lg transition duration-75 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
              >
                <Server className="flex-shrink-0 w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white" />
                <span
                  className={`ml-3 whitespace-nowrap transition-all duration-300 
                              ${!isDrawerOpen
                      ? "opacity-0 hidden"
                      : "opacity-100 block"
                    }
                            `}
                >
                  Servers
                </span>
              </Link>
            </li>
          </ul>

          {/* Removed Reports Dropdown */}

          <ul className="pt-5 mt-5 space-y-2 border-t border-gray-200 dark:border-gray-700">
            <li className="relative">
              <Link
                to="/users"
                className="flex items-center p-2 w-full text-[0.875rem] font-medium text-gray-900 rounded-lg transition duration-75 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
              >
                {/* Icon */}
                <Users className="flex-shrink-0 w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white" />

                {/* Text */}
                <span
                  className={`ml-3 whitespace-nowrap transition-all duration-300 
                            ${!isDrawerOpen
                      ? "opacity-0 hidden"
                      : "opacity-100 block"
                    }
                          `}
                >
                  User Management
                </span>


              </Link>

              {/* Dropdown Items */}
              {isDrawerOpen ? (
                <ul
                  className={`${showAdminDropdown ? "block" : "hidden"
                    } py-2 space-y-2`}
                >
                  {/* <li>
                    <Link
                      to="/create-user"
                      className="flex items-center p-2 pl-11 w-full text-base font-medium text-gray-900 rounded-lg transition duration-75 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                    >
                      Create User
                    </Link>
                  </li> */}


                </ul>
              ) : (
                <div className="absolute left-16 top-0 hidden group-hover:block w-48 bg-white dark:bg-gray-700 shadow-lg rounded-lg z-50">
                  {/* <li>
                    <a
                      href="#"
                      className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      Create User
                    </a>
                  </li> */}

                </div>
              )}
            </li>

            {/* <li>
              <a
                href="#"
                className="flex items-center p-2 text-base font-medium text-gray-900 rounded-lg transition duration-75 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white group"
              >
                <HelpCircle className="flex-shrink-0 w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                <span
                  className={`ml-3 whitespace-nowrap transition-all duration-300 
                              ${!isDrawerOpen
                      ? "opacity-0 hidden"
                      : "opacity-100 block"
                    }
                            `}
                >
                  Help
                </span>
              </a>
            </li> */}
          </ul>
        </div>

        <div className="hidden absolute bottom-0 left-0 justify-center p-4 space-x-4 w-full lg:flex bg-white dark:bg-gray-800 z-20">
          <button
            onClick={toggleTheme}
            className="p-2 mr-1 text-gray-500 rounded-lg hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
          >
            {!isDark ? (
              <svg
                className="w-5 h-5"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="30"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  fillRule="evenodd"
                  d="M11.675 2.015a.998.998 0 0 0-.403.011C6.09 2.4 2 6.722 2 12c0 5.523 4.477 10 10 10 4.356 0 8.058-2.784 9.43-6.667a1 1 0 0 0-1.02-1.33c-.08.006-.105.005-.127.005h-.001l-.028-.002A5.227 5.227 0 0 0 20 14a8 8 0 0 1-8-8c0-.952.121-1.752.404-2.558a.996.996 0 0 0 .096-.428V3a1 1 0 0 0-.825-.985Z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="30"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  fillRule="evenodd"
                  d="M13 3a1 1 0 1 0-2 0v2a1 1 0 1 0 2 0V3ZM6.343 4.929A1 1 0 0 0 4.93 6.343l1.414 1.414a1 1 0 0 0 1.414-1.414L6.343 4.929Zm12.728 1.414a1 1 0 0 0-1.414-1.414l-1.414 1.414a1 1 0 0 0 1.414 1.414l1.414-1.414ZM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm-9 4a1 1 0 1 0 0 2h2a1 1 0 1 0 0-2H3Zm16 0a1 1 0 1 0 0 2h2a1 1 0 1 0 0-2h-2ZM7.757 17.657a1 1 0 1 0-1.414-1.414l-1.414 1.414a1 1 0 1 0 1.414 1.414l1.414-1.414Zm9.9-1.414a1 1 0 0 0-1.414 1.414l1.414 1.414a1 1 0 0 0 1.414-1.414l-1.414-1.414ZM13 19a1 1 0 1 0-2 0v2a1 1 0 1 0 2 0v-2Z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <span className="sr-only">Toggle dark mode</span>
          </button>
        </div>
      </aside>

    </div>
  );
};

export default Header;
