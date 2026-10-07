import { useEffect, useState } from "react";
import { getUsers, updateUserRole } from "../../services/api";

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data.users || []);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const makeAdmin = async (userId) => {
    try {
      await updateUserRole(userId, "admin");

      alert("User promoted to admin successfully");

      loadUsers();
    } catch (error) {
      alert(error.message);
    }
  };

  if (loading) {
    return <div className="p-6">Loading users...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        Users Management
      </h1>

      <div className="space-y-4">
        {users.map((user) => (
          <div
            key={user.userId}
            className="border rounded-xl p-4 flex items-center justify-between"
          >
            <div>
              <h2 className="font-semibold">
                {user.name}
              </h2>

              <p className="text-sm text-gray-500">
                {user.email}
              </p>

              <p className="text-sm text-gray-500">
                {user.phone}
              </p>

              <p className="text-sm mt-1">
                Role: <strong>{user.role}</strong>
              </p>
            </div>

            {user.role === "tenant" && (
              <button
                onClick={() => makeAdmin(user.userId)}
                className="px-4 py-2 rounded-lg bg-black text-white"
              >
                Make Admin
              </button>
            )}

            {user.role === "admin" && (
              <span className="px-4 py-2 rounded-lg bg-green-100 text-green-700">
                Admin
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Users;