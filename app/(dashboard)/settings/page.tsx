'use client';

import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast, { Toaster } from 'react-hot-toast';
import { userApi, ChangePasswordPayload, UpdateUserPayload, ApiResponse, User } from '@/api/user';

const COUNTRIES = [
  { code: 'NG', name: 'Nigeria',        flag: '🇳🇬' },
  { code: 'US', name: 'United States',  flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'GH', name: 'Ghana',          flag: '🇬🇭' },
  { code: 'ZA', name: 'South Africa',   flag: '🇿🇦' },
  { code: 'KE', name: 'Kenya',          flag: '🇰🇪' },
  { code: 'AF', name: 'Afghanistan',    flag: '🇦🇫' },
  { code: 'AL', name: 'Albania',        flag: '🇦🇱' },
  { code: 'DZ', name: 'Algeria',        flag: '🇩🇿' },
  { code: 'AD', name: 'Andorra',        flag: '🇦🇩' },
  { code: 'AO', name: 'Angola',         flag: '🇦🇴' },
  { code: 'AS', name: 'American Samoa', flag: '🇦🇸' },
];

const inputClass =
  'w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-gray-400 bg-white placeholder:text-gray-300 transition-colors';
const labelClass = 'block text-xs text-gray-400 mb-1';

function Section({ title, subtitle, children }: {
  title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-7">
      <div className="mb-6">
        <h2 className="text-base font-medium text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function FormActions({ onReset, isPending, label = 'Save changes' }: {
  onReset: () => void; isPending: boolean; label?: string;
}) {
  return (
    <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-gray-100">
      <button type="button" onClick={onReset} disabled={isPending}
        className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">
        Reset
      </button>
      <button type="submit" disabled={isPending}
        className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 transition-colors min-w-[100px]">
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Saving…
          </span>
        ) : label}
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [profileData, setProfileData] = useState({
    firstName: '', lastName: '', email: '',
    contact: '', country: '', currency: '',
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: '', newPassword: '', confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    old: false, new: false, confirm: false,
  });

  const { data: userData, isLoading, isError } = useQuery({
    queryKey: ['user'],
    queryFn: (): Promise<ApiResponse<User>> => userApi.getUser(),
  });

  const defaultProfile = (d: User | undefined) => ({
    firstName: d?.firstName || '',
    lastName:  d?.lastName  || '',
    email:     d?.email     || '',
    contact:   d?.contact   || '',
    country:   d?.country   || '',
    currency:  d?.currency  || '',
  });

  useEffect(() => {
    if (isError) toast.error('Failed to load your profile');
  }, [isError]);

  useEffect(() => {
    if (userData?.data) setProfileData(defaultProfile(userData.data));
  }, [userData]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateUserPayload) => userApi.updateUser(data),
    onSuccess: (res) => toast.success(res.message || 'Profile updated'),
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to update profile'),
  });

  const passwordMutation = useMutation({
    mutationFn: (data: ChangePasswordPayload) => userApi.changePassword(data),
    onSuccess: (res) => {
      toast.success(res.message || 'Password changed successfully');
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to change password'),
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileData.firstName.trim()) return toast.error('First name is required');
    if (!profileData.email.trim())     return toast.error('Email is required');
    updateMutation.mutate(profileData);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordData.oldPassword)           return toast.error('Current password is required');
    if (passwordData.newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    if (passwordData.newPassword !== passwordData.confirmPassword) return toast.error('Passwords do not match');
    passwordMutation.mutate(passwordData);
  };

  const initials = profileData.firstName
    ? `${profileData.firstName[0]}${profileData.lastName?.[0] ?? ''}`.toUpperCase()
    : 'U';

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <svg className="h-6 w-6 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    </div>
  );

  return (
    <div className="px-8 py-8 max-w-4xl mx-auto space-y-5">
      <Toaster position="top-right" />

      <div className="mb-6">
        <h1 className="text-xl font-medium text-gray-900">Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage your account preferences</p>
      </div>

      {/* ── Profile ── */}
      <Section title="Profile information">
        <form onSubmit={handleProfileSubmit}>

          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
            <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
              {initials}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {[profileData.firstName, profileData.lastName].filter(Boolean).join(' ') || 'Your name'}
              </p>
              <p className="text-xs text-gray-400">{profileData.email || 'your@email.com'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>First name</label>
              <input type="text" placeholder="First name" value={profileData.firstName}
                onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Last name</label>
              <input type="text" placeholder="Last name" value={profileData.lastName}
                onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email address</label>
              <input type="email" placeholder="email@example.com" value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Phone number</label>
              <input type="tel" placeholder="+234 800 000 0000" value={profileData.contact}
                onChange={(e) => setProfileData({ ...profileData, contact: e.target.value })}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Country</label>
              <div className="relative">
                <select value={profileData.country}
                  onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                  className={`${inputClass} appearance-none`}>
                  <option value="" disabled>Select country</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.name}>{c.flag} {c.name}</option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div>
              <label className={labelClass}>Currency</label>
              <input type="text" placeholder="e.g. NGN" value={profileData.currency}
                onChange={(e) => setProfileData({ ...profileData, currency: e.target.value })}
                className={inputClass} />
            </div>
          </div>

          <FormActions
            onReset={() => setProfileData(defaultProfile(userData?.data))}
            isPending={updateMutation.isPending}
          />
        </form>
      </Section>

      {/* ── Password ── */}
      <Section
        title="Change password"
        subtitle="Used to log in and authorise high-severity actions.">
        <form onSubmit={handlePasswordSubmit}>
          <div className="space-y-4">
            {(
              [
                { key: 'oldPassword',     label: 'Current password',  show: 'old'     },
                { key: 'newPassword',     label: 'New password',      show: 'new'     },
                { key: 'confirmPassword', label: 'Confirm password',  show: 'confirm' },
              ] as const
            ).map(({ key, label, show }) => (
              <div key={key}>
                <label className={labelClass}>{label}</label>
                <div className="relative">
                  <input
                    type={showPasswords[show] ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    value={passwordData[key]}
                    onChange={(e) => setPasswordData({ ...passwordData, [key]: e.target.value })}
                    className={`${inputClass} pr-10`}
                  />
                  <button type="button"
                    onClick={() => setShowPasswords((p) => ({ ...p, [show]: !p[show] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                    aria-label={showPasswords[show] ? 'Hide password' : 'Show password'}>
                    {showPasswords[show] ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {/* Strength hint on new password */}
                {key === 'newPassword' && passwordData.newPassword && (
                  <p className={`text-xs mt-1 ${passwordData.newPassword.length < 6 ? 'text-red-400' : 'text-teal-600'}`}>
                    {passwordData.newPassword.length < 6 ? 'Too short — minimum 6 characters' : 'Looks good'}
                  </p>
                )}
                {/* Match hint on confirm */}
                {key === 'confirmPassword' && passwordData.confirmPassword && (
                  <p className={`text-xs mt-1 ${passwordData.confirmPassword !== passwordData.newPassword ? 'text-red-400' : 'text-teal-600'}`}>
                    {passwordData.confirmPassword !== passwordData.newPassword ? 'Passwords do not match' : 'Passwords match'}
                  </p>
                )}
              </div>
            ))}
          </div>

          <FormActions
            onReset={() => setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' })}
            isPending={passwordMutation.isPending}
            label="Update password"
          />
        </form>
      </Section>
    </div>
  );
}