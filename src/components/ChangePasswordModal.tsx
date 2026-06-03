import { useState } from "react";
import Modal from "./Modal";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function ChangePasswordModal({ open, onClose, onSuccess }: ModalProps) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const reset = () => {
    setCurrent("");
    setNext("");
    setConfirm("");
    setError("");
    setSuccess(false);
    setSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (next !== confirm) {
      setError("New passwords do not match");
      return;
    }
    if (next.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You are not logged in");
        setSubmitting(false);
        return;
      }
      const res = await fetch("/api/me/change-password", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ current_password: current, new_password: next }),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `Request failed: ${res.status}`);
      }
      setSuccess(true);
      onSuccess?.();
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to change password");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <Modal open={open} title="Change Password" onClose={handleClose}>
        <div
          style={{
            textAlign: "center",
            fontSize: 13,
            color: "#0F6E56",
            padding: "0.5rem 0",
          }}
        >
          Your password has been changed successfully.
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
    <Modal open={open} title="Change Password" onClose={handleClose}>
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
            Current password
            <input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
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
            New password
            <input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
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
          <label style={{ fontSize: 12, color: "#555", fontWeight: 500 }}>
            Confirm new password
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
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
            disabled={submitting}
            style={{
              flex: 1,
              padding: "0.65rem 1rem",
              borderRadius: 8,
              border: "0.5px solid #1D9E75",
              background: "#1D9E75",
              color: "#fff",
              fontSize: 13,
              fontWeight: 500,
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
