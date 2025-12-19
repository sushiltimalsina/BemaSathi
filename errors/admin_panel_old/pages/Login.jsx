import { useState } from "react";
import { adminLogin } from "../utils/adminApi";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useNavigate } from "react-router-dom";

const AdminLogin = () => {
    const navigate = useNavigate();
    const { login } = useAdminAuth();

    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            const res = await adminLogin({
                email: form.email.trim(),
                password: form.password,
            });

            login(res.data.admin, res.data.token);
            navigate("/admin/dashboard");
        } catch (err) {
            const message =
                err.response?.data?.message ||
                err.message ||
                "Login failed. Try again.";
            setError(message);
        } finally {
            setSubmitting(false);
        }
    };


    return (
        <div className="admin-login-container">
            <div className="admin-login-card">
                <h2>Admin Login</h2>

                {error && <p className="admin-error">{error}</p>}

                <form onSubmit={handleSubmit}>
                    <label>Email</label>
                    <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                    />

                    <label>Password</label>
                    <input
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        required
                    />

                    <button type="submit" className="admin-btn">
                        {submitting ? "Logging in..." : "Login"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
