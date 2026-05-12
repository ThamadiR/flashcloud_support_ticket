import React, { useState } from "react";
import { Label, TextInput, Select } from "flowbite-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useDrawer } from "../../context/DrawerContext";

const CreateRoleForm: React.FC = () => {
  const { isDrawerOpen } = useDrawer();
  const mainMarginClass = isDrawerOpen ? "md:ml-64" : "md:ml-20";
  const [roleName, setRoleName] = useState("");
  const [status, setStatus] = useState("active");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/roles/user-role", {
        role_name: roleName,
        status,
      });
      toast.success("Role created successfully!");
      setRoleName("");
      setStatus("active");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create role.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full flex justify-center items-start px-2 py-4">
        <main
          className={`p-4 ${mainMarginClass} pt-20 w-full transition-all duration-300`}
        >
          <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl py-6">
            {/* Header */}
            <div className="flex justify-between items-center border-b p-4 border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create User Role
              </h2>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-20 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Role Name */}
                <div className="md:col-span-2">
                  <Label htmlFor="roleName">Role Name *</Label>
                  <TextInput
                    id="roleName"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="Admin"
                    required
                    className="mt-1"
                  />
                </div>

                {/* Status */}
                <div className="md:col-span-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    required
                    className="mt-1"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Select>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Save Role
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreateRoleForm;
