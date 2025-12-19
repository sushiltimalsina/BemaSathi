import { useEffect, useState } from "react";
import { getAdminProfile } from "../utils/adminApi";
import AdminNavbar from "../components/AdminNavbar";
import AdminSidebar from "../components/AdminSidebar";

const Profile = () => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getAdminProfile();
        setAdmin(res.data);
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  return (
    <div className="admin-layout">
      <AdminNavbar />
      <div className="admin-main">
        <AdminSidebar />
        <div className="admin-content">
          <h2>Admin Profile</h2>
          {loading ? (
            <p>Loading profile...</p>
          ) : !admin ? (
            <p>Profile unavailable.</p>
          ) : (
            <div className="admin-card profile-card">
              <div>
                <h3>Name</h3>
                <p>{admin.name}</p>
              </div>
              <div>
                <h3>Email</h3>
                <p>{admin.email}</p>
              </div>
              <div>
                <h3>Phone</h3>
                <p>{admin.phone}</p>
              </div>
              <div>
                <h3>Role</h3>
                <p>Admin</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
