'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { UserList } from '~/components/user-list';

interface AppUser {
  id: string;
  email: string;
  username: string;
  isController: boolean;
}

export default function AdminDashboardPage() {
  const { isSignedIn, getToken, isLoaded, userId: currentUserId } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    setError(null);
    setIsLoading(true);

    if (!isSignedIn || !currentUserId) {
      setError('You must be signed in to access this page.');
      setIsLoading(false);
      return;
    }

    try {
      const token = await getToken({ template: 'session' });
      const response = await fetch('/api/users', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();

        const userList: AppUser[] = data.map((user: any) => ({
          id: user.id,
          email: user.email,
          // Combine first/last name or use username field — adjust based on your API
          username: user.username || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown',
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
      setError('An unexpected error occurred while fetching data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchUsers();
    }
  }, [isLoaded, isSignedIn, getToken]);

  // Loading state
  if (!isLoaded || isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
        <p>Loading user data...</p>
      </div>
    );
  }

  // Not signed in
  if (!isSignedIn) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
        <p>You must be signed in to view this page.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
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
    </div>
  );
}