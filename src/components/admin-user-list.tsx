import { useState } from "react";
import type { Doc, Id } from "../../convex/_generated/dataModel";

interface AdminUserListProps {
  users: Doc<"users">[];
  onToggleAdmin: (userId: Id<"users">) => Promise<void>;
  currentUserId: Id<"users"> | undefined;
}

export function AdminUserList({
  users,
  onToggleAdmin,
  currentUserId,
}: AdminUserListProps) {
  const [isUpdating, setIsUpdating] = useState<Id<"users"> | null>(null);

  const handleToggle = async (
    targetUserId: Id<"users">,
    newIsAdmin: boolean,
  ) => {
    if (
      !window.confirm(
        `Are you sure you want to ${newIsAdmin ? "grant" : "revoke"} admin access?`,
      )
    ) {
      return;
    }

    setIsUpdating(targetUserId);
    try {
      await onToggleAdmin(targetUserId);
    } catch (e) {
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="overflow-x-auto shadow-md sm:rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-slate-600">
          <tr>
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
              Is Admin?
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-gray-900">
          {[...users].sort((a, b) => {
            if (a.isAdmin !== b.isAdmin) return a.isAdmin ? -1 : 1;
            return (b.lastActiveAt ?? b.createdAt ?? 0) - (a.lastActiveAt ?? a.createdAt ?? 0);
          }).map((user) => {
            const isSelf = user._id === currentUserId;
            const disabled = isSelf || isUpdating === user._id;

            return (
              <tr key={user._id}>
                <td className="px-6 py-4 text-sm whitespace-nowrap text-white">
                  {user.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      alt={user.username ?? user.email}
                      width={50}
                      height={50}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="h-[50px] w-[50px] rounded-full bg-gray-700" />
                  )}
                </td>
                <td className="px-6 py-4 text-sm whitespace-nowrap text-white">
                  {user.username ?? user.email}
                  {isSelf && (
                    <span className="ml-1 text-xs text-blue-600">(You)</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                  {isSelf ? (
                    <span className="text-xs text-gray-400">
                      Cannot self-toggle
                    </span>
                  ) : (
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={user.isAdmin}
                        onChange={() =>
                          handleToggle(user._id, !user.isAdmin)
                        }
                        disabled={disabled}
                        className="peer sr-only text-white"
                      />
                      <div
                        className={`peer h-6 w-11 rounded-full bg-gray-200 peer-focus:ring-4 peer-focus:ring-indigo-300 peer-focus:outline-none ${user.isAdmin ? "peer-checked:after:translate-x-full peer-checked:after:border-white" : ""} after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:duration-300 after:content-[''] ${disabled ? "cursor-not-allowed opacity-50" : ""} ${user.isAdmin ? "bg-indigo-600" : "bg-gray-400"}`}
                      ></div>
                      <span className="ml-2 text-xs text-white">
                        {isUpdating === user._id
                          ? "Saving..."
                          : user.isAdmin
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
