'use client';

import { useState } from 'react';

import { useRouter }
  from 'next/navigation';

import { api } from '@/lib/axios';

import { useAuthStore }
  from '@/store/authStore';

export default function SignupPage() {
  const router = useRouter();

  const setAuth =
    useAuthStore((state) => state.setAuth);

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  async function handleSignup(
    e: React.FormEvent
  ) {
    e.preventDefault();

    try {
      setError('');

      if (!email || !password) {
        setError(
          'Please fill all fields'
        );

        return;
      }

      if (password.length < 6) {
        setError(
          'Password must be at least 6 characters'
        );

        return;
      }

      setLoading(true);

      // CREATE ACCOUNT

      await api.post('/auth/signup', {
        email,
        password,
      });

      // AUTO LOGIN AFTER SIGNUP

      const loginRes =
        await api.post('/auth/login', {
          email,
          password,
        });

      setAuth(
        loginRes.data.access_token,
        loginRes.data.user
      );

      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);

      if (
        err?.response?.status === 409
      ) {
        setError(
          'User already exists'
        );
      } else {
        setError(
          'Signup failed'
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white border shadow-sm rounded-3xl p-10 w-full max-w-md">
        {/* HEADER */}

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Create Account
          </h1>

          <p className="text-gray-500">
            Start using Smart Notes
          </p>
        </div>

        {/* ERROR */}

        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-xl mb-5 text-sm">
            {error}
          </div>
        )}

        {/* FORM */}

        <form
          onSubmit={handleSignup}
          className="space-y-5"
        >
          {/* EMAIL */}

          <div>
            <label className="block text-sm font-medium mb-2">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="Enter email"
              className="border w-full p-3 rounded-xl"
            />
          </div>

          {/* PASSWORD */}

          <div>
            <label className="block text-sm font-medium mb-2">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              placeholder="Enter password"
              className="border w-full p-3 rounded-xl"
            />
          </div>

          {/* BUTTON */}

          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white w-full p-3 rounded-xl disabled:opacity-50"
          >
            {loading
              ? 'Creating Account...'
              : 'Sign Up'}
          </button>
        </form>

        {/* FOOTER */}

        <p className="text-sm text-gray-500 text-center mt-6">
          Already have an account?
        </p>

        <button
          onClick={() =>
            router.push('/login')
          }
          className="text-black font-medium w-full mt-2"
        >
          Login
        </button>
      </div>
    </div>
  );
}