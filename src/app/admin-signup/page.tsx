'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowRight,
  Shield,
  Users,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import GoogleOAuthAdmin from '@/components/GoogleOAuthAdmin';
import { signupSchema, type SignupFormData } from '@/schemas/auth';

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { signupAdmin } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setError('');

    const result = await signupAdmin({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
    });

    if (!result.success) {
      setError(result.error || 'Signup failed');
    }

    setIsLoading(false);
  };

  return (
    <div className="h-screen flex flex-col lg:flex-row bg-gray-50 overflow-hidden">
      {/* Left Column - Brand & Benefits */}
      <div className="lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 lg:p-12 flex flex-col justify-center relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="relative z-10 text-white pl-4 lg:pl-8">
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 leading-tight" data-testid="admin-portal-title">
              Admin Portal
              <span className="block text-blue-100">Registration</span>
            </h1>
            <p className="text-lg text-blue-100 leading-relaxed max-w-md">
              Create your admin account to manage users, datasets, and system
              configurations with full administrative privileges.
            </p>
          </div>

          {/* Benefits List */}
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-blue-100" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg mb-1" data-testid="full-system-control-title">
                  Full System Control
                </h3>
                <p className="text-blue-100 text-sm leading-relaxed">
                  Complete administrative access to manage users, datasets, and
                  system configurations
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-blue-100" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg mb-1">
                  User Management
                </h3>
                <p className="text-blue-100 text-sm leading-relaxed">
                  Create, modify, and manage user accounts with granular
                  permission controls
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-blue-100" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg mb-1">
                  Dataset Administration
                </h3>
                <p className="text-blue-100 text-sm leading-relaxed">
                  Oversee all datasets, manage sharing permissions, and monitor
                  system usage
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Signup Form */}
      <div className="lg:w-1/2 bg-white p-6 lg:p-12 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2" data-testid="create-admin-account-title">
              Create Admin Account
            </h2>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl" data-testid="admin-signup-error-message">
              <p className="text-sm text-red-600 flex items-center">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="firstName"
                  className="text-sm font-medium text-gray-700"
                >
                  First Name
                </Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="First name"
                    {...register('firstName')}
                    data-testid="admin-signup-first-name-input"
                    className={`pl-12 h-11 border-2 focus:ring-4 focus:ring-blue-100 rounded-xl text-sm transition-all duration-200 ${
                      errors.firstName
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-gray-200 focus:border-blue-500'
                    }`}
                    disabled={isLoading}
                  />
                </div>
                {errors.firstName && (
                  <p className="text-sm text-red-600" data-testid="validation-error-first-name">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="lastName"
                  className="text-sm font-medium text-gray-700"
                >
                  Last Name
                </Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Last name"
                    {...register('lastName')}
                    data-testid="admin-signup-last-name-input"
                    className={`pl-12 h-11 border-2 focus:ring-4 focus:ring-blue-100 rounded-xl text-sm transition-all duration-200 ${
                      errors.lastName
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-gray-200 focus:border-blue-500'
                    }`}
                    disabled={isLoading}
                  />
                </div>
                {errors.lastName && (
                  <p className="text-sm text-red-600" data-testid="validation-error-last-name">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-gray-700"
              >
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  {...register('email')}
                  data-testid="admin-signup-email-input"
                  className={`pl-12 h-11 border-2 focus:ring-4 focus:ring-blue-100 rounded-xl text-sm transition-all duration-200 ${
                    errors.email
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-200 focus:border-blue-500'
                  }`}
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600" data-testid="validation-error-email">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-gray-700"
              >
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  {...register('password')}
                  data-testid="admin-signup-password-input"
                  className={`pl-12 pr-12 h-11 border-2 focus:ring-4 focus:ring-blue-100 rounded-xl text-sm transition-all duration-200 ${
                    errors.password
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-200 focus:border-blue-500'
                  }`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="admin-signup-show-password-button"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600" data-testid="validation-error-password">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-gray-700"
              >
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  {...register('confirmPassword')}
                  data-testid="admin-signup-confirm-password-input"
                  className={`pl-12 pr-12 h-11 border-2 focus:ring-4 focus:ring-blue-100 rounded-xl text-sm transition-all duration-200 ${
                    errors.confirmPassword
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-200 focus:border-blue-500'
                  }`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-600" data-testid="validation-error-confirm-password">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={!isValid || isLoading}
              data-testid="admin-signup-submit-button"
              className="w-full h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" data-testid="admin-signup-loading-spinner"></div>
                  Creating Admin Account...
                </div>
              ) : (
                <>
                  Create Admin Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google OAuth Admin */}
          <div data-testid="admin-signup-google-button">
            <GoogleOAuthAdmin disabled={isLoading} />
          </div>

          {/* Spacing */}
          <div className="mb-4"></div>

          {/* Sign In Link */}
          <div className="text-center">
            <p className="text-gray-600 text-sm">
              Already have an admin account?{' '}
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-700 font-medium underline"
                data-testid="admin-signup-login-link"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
