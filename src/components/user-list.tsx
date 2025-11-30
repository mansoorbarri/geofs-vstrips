import Image from "next/image";
import { useState } from "react";

interface AppUser {
  id: string;
  email: string;
  username: string;
  isController: boolean;
  profile: string;
}

interface UserListProps {
  users: AppUser[];
  onRoleChange: () => Promise<void>;
  currentUserId: string | null | undefined;
}

export function UserList({
  users,
  onRoleChange,
  currentUserId,
}: UserListProps) {
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const handleToggle = async (
    targetUserId: string,
    newIsController: boolean,
  ) => {
    if (
      !window.confirm(
        `Are you sure you want to ${newIsController ? "grant" : "revoke"} controller access?`,
      )
    ) {
      return;
    }

    setIsUpdating(targetUserId);
    try {
      const response = await fetch(`/api/users`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: targetUserId }),
        // body: JSON.stringify({ isController: newIsController }),
      });
      if (response.ok) {
        await onRoleChange();
      } else {
        const errorText = await response.text();
        alert(`Failed to update: ${errorText}`);
      }
    } catch (e) {
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setIsUpdating(null);
    }
  };
  console.log(users);
  return (
    <div className="overflow-x-auto shadow-md sm:rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-slate-600">
          <tr>
            {/* <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th> */}
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium tracking-wider text-white uppercase"
            >
              Profile
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium tracking-wider text-white uppercase"
            >
              Username
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium tracking-wider text-white uppercase"
            >
              Is Controller?
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-gray-900">
          {users.map((user) => {
            const isSelf = user.id === currentUserId;
            const disabled = isSelf || isUpdating === user.id;

            return (
              <tr key={user.id}>
                <td className="px-6 py-4 text-sm whitespace-nowrap text-white">
                  <Image
                    src={user.profile}
                    alt={user.username}
                    width={50}
                    height={50}
                    className="rounded-full"
                  ></Image>
                </td>
                <td className="px-6 py-4 text-sm whitespace-nowrap text-white">
                  {user.username}
                  {isSelf && (
                    <span className="ml-1 text-xs text-blue-600">(You)</span>
                  )}
                </td>
                {/* <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.isController
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {user.isController ? 'Controller' : 'User'}
                  </span>
                </td> */}
                <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                  {isSelf ? (
                    <span className="text-xs text-gray-400">
                      Cannot self-toggle
                    </span>
                  ) : (
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={user.isController}
                        onChange={() =>
                          handleToggle(user.id, !user.isController)
                        }
                        disabled={disabled}
                        className="peer sr-only text-white"
                      />
                      <div
                        className={`peer h-6 w-11 rounded-full bg-gray-200 peer-focus:ring-4 peer-focus:ring-indigo-300 peer-focus:outline-none ${user.isController ? "peer-checked:after:translate-x-full peer-checked:after:border-white" : ""} after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:duration-300 after:content-[''] ${disabled ? "cursor-not-allowed opacity-50" : ""} ${user.isController ? "bg-indigo-600" : "bg-gray-400"}`}
                      ></div>
                      <span className="ml-2 text-xs text-white">
                        {isUpdating === user.id
                          ? "Saving..."
                          : user.isController
                            ? "True"
                            : "False"}
                      </span>
                    </label>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
