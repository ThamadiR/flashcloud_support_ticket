import React, { useState, useEffect } from "react";
import { Label, TextInput, Select } from "flowbite-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useDrawer } from "../../context/DrawerContext";

interface Role {
  id: number;
  role_name: string;
}

const CreateUserPage: React.FC = () => {
  const { isDrawerOpen } = useDrawer();
  const mainMarginClass = isDrawerOpen ? "md:ml-64" : "md:ml-20";
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("active");
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await axios.get<Role[]>(
          "http://localhost:5000/api/roles/user-role"
        );
        setRoles(response.data);
      } catch (error) {
        toast.error("Failed to fetch roles");
      }
    };
    fetchRoles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await axios.post("http://localhost:5000/api/auth/register_user", {
        fname,
        lname,
        email,
        password,
        roleId: Number(role),
        status,
      });

      toast.success("User created successfully!");

      setFname("");
      setLname("");
      setEmail("");
      setPassword("");
      setRole("");
      setStatus("active");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create user.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full flex justify-center items-start px-1 py-2">
        <main
          className={`p-4 ${mainMarginClass} pt-20 w-full transition-all duration-300`}
        >
          <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl">
            {/* Header */}
            <div
              className="flex justify-between items-center border-b p-4 
                                border-gray-200 dark:border-gray-700"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create User
              </h2>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <Label>First Name *</Label>
                  <TextInput
                    value={fname}
                    onChange={(e) => setFname(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <Label>Last Name *</Label>
                  <TextInput
                    value={lname}
                    onChange={(e) => setLname(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>

                {/* Email */}
                <div className="md:col-span-2">
                  <Label>Email *</Label>
                  <TextInput
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>

                {/* Password */}
                <div className="md:col-span-2">
                  <Label>Password *</Label>
                  <TextInput
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>

                {/* Role */}
                <div>
                  <Label>Role *</Label>
                  <Select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                    className="mt-1"
                  >
                    <option value="">Select Role</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.role_name}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Status */}
                <div>
                  <Label>Status *</Label>
                  <Select
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
              <div
                className="flex justify-end space-x-3 pt-4 border-t 
                                border-gray-200 dark:border-gray-700"
              >
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                                bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 
                                dark:hover:bg-gray-600"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 
                                rounded-md hover:bg-blue-700"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreateUserPage;
