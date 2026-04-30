import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Add this import
import { Button, Checkbox, Label, TextInput } from "flowbite-react";
import FlashLogo from "../../assets/logo.png";
import { Link } from "react-router-dom";
import axios from "axios";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate(); // Initialize navigate

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Your login logic (fake validation for now)
    /* if (email && password) {
      console.log({ email, password });
      navigate("/dashboard"); // Navigate to dashboard
    } else {
      // Optionally show error
    }*/

    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          email,
          password,
        }
      );

      // Save JWT token in localStorage
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      // Navigate to dashboard
      navigate("/dashboard");
    } catch (err: any) {
      if (err.response && err.response.data) {
        setError(err.response.data.message || "Login failed");
      } else {
        setError("Login failed. Please try again.");
      }
    }
  };

  return (
    <section className="bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow dark:border dark:bg-gray-800 dark:border-gray-700">
        <div className="space-y-6">
          <div className="text-center">
            <img className="mx-auto" src={FlashLogo} alt="Flowbite" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mt-4">
              Sign in to your account
            </h1>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <Label htmlFor="email" />
              <TextInput
                id="email"
                type="email"
                placeholder="name@company.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password" />
              <TextInput
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox id="remember" />
                <Label htmlFor="remember">Remember me</Label>
              </div>
              <a
                href="#"
                className="text-sm text-primary-600 hover:underline dark:text-primary-500"
              >
                Forgot password?
              </a>
            </div>

            <Button type="submit" className="w-full">
              Sign in
            </Button>

            <p className="text-sm text-center text-gray-500 dark:text-gray-400">
              Don’t have an account yet?{" "}
              <Link
                to="/signup"
                className="font-medium text-primary-600 hover:underline dark:text-primary-500"
              >
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </section>
  );
};

export default LoginPage;
