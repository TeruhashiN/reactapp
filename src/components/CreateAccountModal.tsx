import { useState } from "react";
import Modal from "./Modal";

export default function CreateAccountModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const reset = () => {
    setUsername("");
    setPassword("");
    setError("");
    setSuccess(false);
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username || !password) return setError("All fields are required");
    if (username.length < 3) return setError("Username must be at least 3 characters");
    if (password.length < 6) return setError("Password must be at least 6 characters");

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create account");

      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Modal open={open} title="Create Account" onClose={handleClose}>
        <div
          style={{
            textAlign: "center",
            fontSize: 13,
            color: "#085041",
            padding: "0.5rem 0",
            background: "#E1F5EE",
            borderRadius: 8,
          }}
        >
          Successfully created an account.
        </div>
        <button
          type="button"
          onClick={handleClose}
          style={{
            width: "100%",
            marginTop: 12,
            padding: "0.65rem 1rem",
            borderRadius: 8,
            border: "0.5px solid #1D9E75",
            background: "#E1F5EE",
            color: "#085041",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Done
        </button>
      </Modal>
    );
  }

  return (
    <Modal open={open} title="Create Account" onClose={handleClose}>
      <form onSubmit={submit}>
        {error && (
          <p
            style={{
              color: "#A32D2D",
              fontSize: 12,
              margin: "0 0 0.75rem",
              background: "#FCEBEB",
              padding: "0.5rem 0.75rem",
              borderRadius: 8,
              border: "0.5px solid #F09595",
            }}
          >
            {error}
          </p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <label style={{ fontSize: 12, color: "#555", fontWeight: 500 }}>
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              style={{
                marginTop: 4,
                width: "100%",
                padding: "0.55rem 0.75rem",
                borderRadius: 8,
                border: "0.5px solid #D3D1C7",
                fontSize: 13,
                boxSizing: "border-box",
              }}
            />
          </label>
          <label style={{ fontSize: 12, color: "#555", fontWeight: 500 }}>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{
                marginTop: 4,
                width: "100%",
                padding: "0.55rem 0.75rem",
                borderRadius: 8,
                border: "0.5px solid #D3D1C7",
                fontSize: 13,
                boxSizing: "border-box",
              }}
            />
          </label>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button
            type="button"
            onClick={handleClose}
            style={{
              flex: 1,
              padding: "0.65rem 1rem",
              borderRadius: 8,
              border: "0.5px solid #D3D1C7",
              background: "#fff",
              color: "#444",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              flex: 1,
              padding: "0.65rem 1rem",
              borderRadius: 8,
              border: "0.5px solid #3C3489",
              background: "#EEEDFE",
              color: "#3C3489",
              fontSize: 13,
              fontWeight: 500,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Creating…" : "Create"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
