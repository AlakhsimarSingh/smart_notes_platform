'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { api } from '@/lib/axios';

import { useAuthStore }
  from '@/store/authStore';

export default function LoginPage() {
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

  async function handleLogin(
    e: React.FormEvent
  ) {
    e.preventDefault();

    try {
      setError('');

      // basic validation

      if (!email || !password) {
        setError(
          'Please enter email and password'
        );

        return;
      }

      setLoading(true);

      const res = await api.post(
        '/auth/login',
        {
          email,
          password,
        }
      );

      // expected backend response:
      // {
      //   access_token,
      //   user: {
      //     id,
      //     email
      //   }
      // }

      setAuth(
        res.data.access_token,
        res.data.user
      );
      document.cookie = `token=${res.data.access_token}; path=/`;

      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);

      if (
        err?.response?.status === 401
      ) {
        setError(
          'Invalid email or password'
        );
      } else {
        setError(
          'Login failed. Please try again.'
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
            Welcome Back
          </h1>

          <p className="text-gray-500">
            Login to your smart notes
            workspace
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
          onSubmit={handleLogin}
          className="space-y-5"
        >
          {/* EMAIL */}

          <div>
            <label className="block text-sm font-medium mb-2">
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              className="border w-full p-3 rounded-xl outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* PASSWORD */}

          <div>
            <label className="block text-sm font-medium mb-2">
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              className="border w-full p-3 rounded-xl outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* LOGIN BUTTON */}

          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white w-full p-3 rounded-xl font-medium disabled:opacity-50"
          >
            {loading
              ? 'Logging in...'
              : 'Login'}
          </button>
        </form>

        {/* FOOTER */}

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Don&apos;t have an account?
          </p>

          <button
            onClick={() => router.push('/signup')}
            className="mt-2 text-black font-semibold hover:underline"
          >
            Create an account
          </button>
        </div>
      </div>
    </div>
  );
}