'use client';

import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

interface ProfileData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  section: string | null;
  schoolMailId: string | null;
  phone: string | null;
  alternatePhone: string | null;
  photoUrl: string | null;
}

interface ApiResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: ProfileData;
}

export default function UserProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const authCookie = Cookies.get('auth');
        let token: string | undefined;
        if (authCookie) {
          try {
            token = JSON.parse(authCookie).token;
          } catch (e) {
            console.error('Error parsing auth cookie', e);
          }
        }

        if (!token) {
          router.push('/login');
          return;
        }

        const res = await fetch(
          'https://apisimplylearn.selflearnai.in/api/v1/users/auth/get-profile',
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!res.ok) {
          throw new Error('Failed to fetch profile');
        }

        const json: ApiResponse = await res.json();
        setProfile(json.data);
      } catch (err: any) {
        console.error(err);
        setError('Unable to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleLogout = () => {
    Cookies.remove('auth');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <p className='text-red-600 text-lg mb-4'>
            {error || 'Profile not found'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className='px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600'
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8 px-4 sm:px-6 md:px-8'>
      <div className='max-w-4xl mx-auto'>
        <div className='flex justify-between items-center mb-6'>
          <h1 className='text-2xl font-semibold text-gray-800'>My Profile</h1>

          {/* Top-right section with class/school info and buttons */}
          <div className='flex flex-col sm:flex-row items-end sm:items-center gap-4 sm:gap-6'>
            {/* Class and School Info - Vertical Stack */}
            <div className='text-right sm:text-left'>
              {profile.section && (
                <div className='text-sm text-gray-600 mb-1'>
                  Class: Section {profile.section}
                </div>
              )}
              <div className='text-sm text-gray-600'>School: Self Learn AI</div>
            </div>

            {/* Action Buttons with Icons */}
            <div className='flex items-center gap-3'>
              <button
                onClick={() => router.push('/')}
                className='px-4 py-2 bg-white text-gray-700 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-2'
              >
                <svg
                  className='w-4 h-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z'
                  />
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M8 5v4m4-4v4m4-4v4'
                  />
                </svg>
                Dashboard
              </button>
              <button
                onClick={handleLogout}
                className='px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors flex items-center gap-2'
              >
                <svg
                  className='w-4 h-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
                  />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-6'>
          <div className='flex flex-col sm:flex-row items-center sm:items-start gap-6'>
            <img
              src={profile.photoUrl || '/images/imageprofile.png'}
              alt='Profile'
              className='w-24 h-24 rounded-full object-cover border'
            />
            <div className='flex-1'>
              <div className='text-xl font-semibold text-gray-900'>
                {profile.firstName} {profile.lastName}
              </div>
              <div className='text-gray-500'>{profile.email}</div>
              <div className='mt-2 inline-flex items-center gap-2 text-sm text-gray-600'>
                <span className='px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200'>
                  {profile.gender}
                </span>
                {profile.dob && (
                  <span className='px-2 py-0.5 rounded-full bg-gray-50 text-gray-700 border'>
                    DOB: {new Date(profile.dob).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className='mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div className='p-4 rounded-xl bg-gray-50 border'>
              <div className='text-gray-500 text-sm'>School Email</div>
              <div className='font-medium'>{profile.schoolMailId || '—'}</div>
            </div>
            <div className='p-4 rounded-xl bg-gray-50 border'>
              <div className='text-gray-500 text-sm'>Primary Phone</div>
              <div className='font-medium'>{profile.phone || '—'}</div>
            </div>
            <div className='p-4 rounded-xl bg-gray-50 border'>
              <div className='text-gray-500 text-sm'>Alternate Phone</div>
              <div className='font-medium'>{profile.alternatePhone || '—'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
