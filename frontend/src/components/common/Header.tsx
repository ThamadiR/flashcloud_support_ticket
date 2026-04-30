import { useEffect, useState } from "react";
import FlashLogo from "../../assets/assets/logo.png";
import { Link } from "react-router-dom";
import React from "react";
import { useSearch } from "../../context/SearchContext";
import { useDrawer } from "../../context/DrawerContext";
import { useTheme } from "../../context/ThemeContext";
import "flowbite";
import { useNavigate } from "react-router-dom";
import { Dropdown } from "flowbite";
import "flowbite/dist/flowbite.min.js";
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
  const { searchTerm, setSearchTerm } = useSearch();

  const { isDark, toggleTheme } = useTheme();

  const [showAdminDropdown, setShowAdminDropdown] = useState(false);

  //const [collapsed, setCollapsed] = useState(false);
  const { isDrawerOpen, setIsDrawerOpen } = useDrawer();

  const [showReports, setShowReports] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const initials = `${user?.fname?.charAt(0) || ""}${
    user?.lname?.charAt(0) || ""
  }`.toUpperCase();

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  useEffect(() => {
    new Dropdown(
      document.getElementById("dropdown-menu"),
      document.getElementById("user-menu-button")
    );
  }, []);

  return (
    <div className="antialiased bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white border-b border-gray-200 px-4 py-2.5 dark:bg-gray-800 dark:border-gray-700 fixed left-0 right-0 top-0 z-50">
        <div className="flex flex-wrap justify-between items-center">
          <div className="flex justify-start items-center">
            {/*<button
              data-drawer-target="drawer-navigation"
              data-drawer-toggle="drawer-navigation"
              aria-controls="drawer-navigation"
              className="p-2 mr-2 text-gray-600 rounded-lg cursor-pointer md:hidden hover:text-gray-900 hover:bg-gray-100 focus:bg-gray-100 dark:focus:bg-gray-700 focus:ring-2 focus:ring-gray-100 dark:focus:ring-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            >
              <svg
                aria-hidden="true"
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill-rule="evenodd"
                  d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clip-rule="evenodd"
                ></path>
              </svg>
              <svg
                aria-hidden="true"
                className="hidden w-6 h-6"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                ></path>
              </svg>
              <span className="sr-only">Toggle sidebar</span>
            </button>*/}

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
              href="https://flowbite.com"
              className="flex items-center justify-between mr-4"
            >
              <img
                src={FlashLogo}
                className="mr-3 h-12 ml-7"
                alt="Flowbite Logo"
              />
            </a>
            <form action="#" method="GET" className="hidden md:block md:pl-2">
              <label htmlFor="topbar-search" className="sr-only">
                Search
              </label>
              <div className="relative md:w-64 md:w-96">
                <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-500 dark:text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    ></path>
                  </svg>
                </div>
                <input
                  type="text"
                  id="topbar-search"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                />
              </div>
            </form>
          </div>

          <div className="flex items-center lg:order-2">
            <button
              type="button"
              data-drawer-toggle="drawer-navigation"
              aria-controls="drawer-navigation"
              className="p-2 mr-1 text-gray-500 rounded-lg md:hidden hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
            >
              <span className="sr-only">Toggle search</span>
              <svg
                aria-hidden="true"
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  clip-rule="evenodd"
                  fill-rule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                ></path>
              </svg>
            </button>

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
                  <div className="pl-3 w-full">
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
                  </div>
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
              className="flex mx-3 text-sm bg-gray-800 rounded-full md:mr-0 focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
              id="user-menu-button"
              data-dropdown-toggle="dropdown-menu"
            >
              <span className="sr-only">Open user menu</span>
              {/*<img
                className="w-8 h-8 rounded-full"
                src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/avatars/michael-gough.png"
                alt="user photo"
              />*/}
              <div
                className="w-8 h-8 flex items-center justify-center 
                  bg-indigo-600 text-white rounded-full 
                  font-semibold text-sm"
              >
                {initials}
              </div>
            </button>

            <div
              className="hidden z-50 my-4 w-56 text-base list-none bg-white rounded divide-y divide-gray-100 shadow dark:bg-gray-700 dark:divide-gray-600 rounded-xl"
              id="dropdown-menu"
            >
              <div className="py-3 px-4">
                <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                  {user?.fname} {user?.lname}
                </span>
                <span className="block text-sm text-gray-900 truncate dark:text-white">
                  {user?.email}
                </span>
              </div>
              <ul
                className="py-1 text-gray-700 dark:text-gray-300"
                aria-labelledby="dropdown-menu"
              >
                <li>
                  <a
                    onClick={() => navigate("/profile")}
                    className="block py-2 px-4 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-400 dark:hover:text-white cursor-pointer"
                  >
                    My profile
                  </a>
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
        className={`fixed top-10 left-0 z-40 h-[calc(100vh-56px)]
              transition-all duration-300 bg-white dark:bg-gray-800 
              border-r border-gray-200 dark:border-gray-700
              ${isDrawerOpen ? "w-64" : "w-20"}
            `}
        id="drawer-navigation"
      >
        <div className="overflow-y-auto pt-12 pb-6 px-4 h-full">
          <form action="#" method="GET" className="md:hidden mb-2">
            <label htmlFor="sidebar-search" className="sr-only">
              Search
            </label>
            <div className="relative">
              <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-500 dark:text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  ></path>
                </svg>
              </div>
              <input
                type="text"
                name="search"
                id="sidebar-search"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                placeholder="Search"
              />
            </div>
          </form>
          <ul className="space-y-2">
            <li>
              <Link
                to="/dashboard"
                className="flex items-center p-2 text-base font-medium text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
              >
                <svg
                  aria-hidden="true"
                  className="w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"></path>
                  <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"></path>
                </svg>
                <span
                  className={`ml-3 whitespace-nowrap transition-all duration-300 
                              ${
                                !isDrawerOpen
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
                className="flex items-center p-2 w-full text-base font-medium text-gray-900 rounded-lg transition duration-75 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
              >
                <svg
                  aria-hidden="true"
                  className="flex-shrink-0 w-6 h-6 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                    clipRule="evenodd"
                  ></path>
                </svg>
                <span
                  className={`ml-3 whitespace-nowrap transition-all duration-300 
                              ${
                                !isDrawerOpen
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
                className="flex items-center p-2 w-full text-base font-medium text-gray-900 rounded-lg transition duration-75 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
              >
                <svg
                  aria-hidden="true"
                  className="flex-shrink-0 w-6 h-6 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
                <span
                  className={`ml-3 whitespace-nowrap transition-all duration-300 
                              ${
                                !isDrawerOpen
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
                className="flex items-center p-2 w-full text-base font-medium text-gray-900 rounded-lg transition duration-75 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
              >
                <svg
                  aria-hidden="true"
                  className="flex-shrink-0 w-6 h-6 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
                <span
                  className={`ml-3 whitespace-nowrap transition-all duration-300 
                              ${
                                !isDrawerOpen
                                  ? "opacity-0 hidden"
                                  : "opacity-100 block"
                              }
                            `}
                >
                  Companies
                </span>
              </Link>
            </li>
          </ul>
          {/* Removed Reports Dropdown */}

          <ul className="pt-5 mt-5 space-y-2 border-t border-gray-200 dark:border-gray-700">
            <li className="relative">
              <button
                type="button"
                onClick={() => setShowAdminDropdown(!showAdminDropdown)}
                className="flex items-center p-2 w-full text-base font-medium text-gray-900 rounded-lg transition duration-75 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
              >
                {/* Icon */}
                <svg
                  aria-hidden="true"
                  className="flex-shrink-0 w-6 h-6 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path>
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                  ></path>
                </svg>

                {/* Text */}
                <span
                  className={`ml-3 whitespace-nowrap transition-all duration-300 
                            ${
                              !isDrawerOpen
                                ? "opacity-0 hidden"
                                : "opacity-100 block"
                            }
                          `}
                >
                  Admin Manage
                </span>

                {/* Arrow */}
                <svg
                  aria-hidden="true"
                  className={`w-6 h-6 transition-transform ${
                    showAdminDropdown ? "rotate-180" : ""
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  ></path>
                </svg>
              </button>

              {/* Dropdown Items */}
              {isDrawerOpen ? (
                <ul
                  className={`${
                    showAdminDropdown ? "block" : "hidden"
                  } py-2 space-y-2`}
                >
                  <li>
                    <Link
                      to="/create-user"
                      className="flex items-center p-2 pl-11 w-full text-base font-medium text-gray-900 rounded-lg transition duration-75 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                    >
                      Create User
                    </Link>
                  </li>

                  <li>
                    <Link
                      to="/create-role"
                      className="flex items-center p-2 pl-11 w-full text-base font-medium text-gray-900 rounded-lg transition duration-75 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                    >
                      Create Role
                    </Link>
                  </li>
                </ul>
              ) : (
                <div className="absolute left-16 top-0 hidden group-hover:block w-48 bg-white dark:bg-gray-700 shadow-lg rounded-lg z-50">
                  <li>
                    <a
                      href="#"
                      className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      Create User
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      Create Role
                    </a>
                  </li>
                </div>
              )}
            </li>

            <li>
              <a
                href="#"
                className="flex items-center p-2 text-base font-medium text-gray-900 rounded-lg transition duration-75 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white group"
              >
                <svg
                  aria-hidden="true"
                  className="flex-shrink-0 w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill-rule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0c0 .993-.241 1.929-.668 2.754l-1.524-1.525a3.997 3.997 0 00.078-2.183l1.562-1.562C15.802 8.249 16 9.1 16 10zm-5.165 3.913l1.58 1.58A5.98 5.98 0 0110 16a5.976 5.976 0 01-2.516-.552l1.562-1.562a4.006 4.006 0 001.789.027zm-4.677-2.796a4.002 4.002 0 01-.041-2.08l-.08.08-1.53-1.533A5.98 5.98 0 004 10c0 .954.223 1.856.619 2.657l1.54-1.54zm1.088-6.45A5.974 5.974 0 0110 4c.954 0 1.856.223 2.657.619l-1.54 1.54a4.002 4.002 0 00-2.346.033L7.246 4.668zM12 10a2 2 0 11-4 0 2 2 0 014 0z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
                <span
                  className={`ml-3 whitespace-nowrap transition-all duration-300 
                              ${
                                !isDrawerOpen
                                  ? "opacity-0 hidden"
                                  : "opacity-100 block"
                              }
                            `}
                >
                  Help
                </span>
              </a>
            </li>
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
                height="24"
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
                height="24"
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
