'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth } from '@clerk/nextjs';
import { UserList } from '~/components/user-list';
import Footer from '~/components/footer';
import Loading from '~/components/loading';
import Header from '~/components/header';

interface AppUser {
  id: string;
  email: string;
  username: string;
  isController: boolean;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isLoaded: authLoaded, isSignedIn, user } = useUser();

  const [users, setUsers] = useState<AppUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const currentUserId = user?.id;

  // Redirect logic: Only allow if user is controller
  useEffect(() => {
    if (!authLoaded) return;

    if (!isSignedIn) {
      router.push('/sign-up');
      return;
    }
    const isAdmin = Boolean(user?.publicMetadata?.admin);
    if (!isAdmin) {
      router.push('https://www.youtube.com/watch?v=dQw4w9WgXcQ'); 
    }
  }, [authLoaded, isSignedIn, user, router]);

  // Fetch users
  const fetchUsers = async () => {
    if (!isSignedIn || !currentUserId) return;

    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const userList: AppUser[] = data.map((user: any) => ({
          id: user.id,
          email: user.email,
          username:
            user.username ||
            `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
            'Unknown',
          isController: Boolean(user.isController),
        }));
        setUsers(userList);
      } else {
        const errorMessage = await response.text();
        setError(`Access Error (${response.status}): ${errorMessage}`);
        setUsers([]);
      }
    } catch (e) {
      console.error('Fetch users error:', e);
      setError('Failed to load users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authLoaded && isSignedIn && user?.publicMetadata?.controller) {
      const loadUsers = async () => {
        await fetchUsers();
      };
      void loadUsers();
    }
  }, [authLoaded, isSignedIn, user?.publicMetadata?.controller]);

  // Early returns
  if (!authLoaded || isLoading) {
    return <Loading />;
  }

  if (!isSignedIn) {
    return null; // Redirect will handle it
  }

  const isController = Boolean(user?.publicMetadata?.controller);
  if (!isController) {
    return null; // Redirect will handle it
  }

  return (
    <div className="px-8">
      <Header />
      <h1 className="text-3xl font-bold mb-4 mt-5">Controller Dashboard</h1>
      <p className="text-gray-600 mb-6">
        Manage controller access for users below.
      </p>

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6"
          role="alert"
        >
          <strong className="font-bold">Error! </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {users.length > 0 ? (
        <UserList
          users={users}
          onRoleChange={fetchUsers}
          currentUserId={currentUserId}
        />
      ) : (
        !error && <p className="text-gray-500">No users found.</p>
      )}

      <Footer />
    </div>
  );
}