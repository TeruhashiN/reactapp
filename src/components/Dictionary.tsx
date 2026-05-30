import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type DictionaryItem = {
  english: string;
  meaning: string;
  chinese: string;
};

export default function Dictionary() {
  const navigate = useNavigate();
  const [items, setItems] = useState<DictionaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("http://localhost:4000/api/dictionary/english");
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || `Request failed: ${res.status}`);
        }

        const data: { items: DictionaryItem[] } = await res.json();
        // Ensure A→Z sort client-side too (in case SQL collation differs)
        const sorted = [...(data.items ?? [])].sort((a, b) => {
          const aw = (a.english ?? "").toString().trim().toLowerCase();
          const bw = (b.english ?? "").toString().trim().toLowerCase();
          return aw.localeCompare(bw);
        });
        setItems(sorted);
      } catch (e: any) {
        setItems([]);
        setError(e?.message || "Failed to load dictionary");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const firstLetterGroups = useMemo(() => {
    const groups = new Map<string, DictionaryItem[]>();
    for (const it of items) {
      const w = (it.english ?? "").trim();
      const letter = w ? w[0].toUpperCase() : "#";
      if (!groups.has(letter)) groups.set(letter, []);
      groups.get(letter)!.push(it);
    }
    // Return groups sorted A->Z
    return [...groups.entries()].sort((a, b) => {
      if (a[0] === "#") return 1;
      if (b[0] === "#") return -1;
      return a[0].localeCompare(b[0]);
    });
  }, [items]);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f5f4f0",
        padding: "24px 16px 48px",
      }}
    >
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <div
          style={{
            background: "#fff",
            border: "0.5px solid #D3D1C7",
            borderRadius: 12,
            padding: "1.25rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
                Dictionary
              </h1>
              <p style={{ color: "#888780", marginTop: 8 }}>
                English → Meaning → Chinese (A→Z)
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              style={{
                border: "0.5px solid #D3D1C7",
                background: "#fff",
                padding: "10px 12px",
                borderRadius: 10,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                color: "#3C3489",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                whiteSpace: "nowrap",
                transition:
                  "transform 0.12s ease, box-shadow 0.12s ease, background 0.12s ease",
              }}
              aria-label="Back to dashboard"
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 8px 18px rgba(60, 52, 137, 0.10)";
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(-1px)";
                (e.currentTarget as HTMLButtonElement).style.background =
                  "#EEEDFE";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(0)";
                (e.currentTarget as HTMLButtonElement).style.background =
                  "#fff";
              }}
            >
              <span aria-hidden="true">←</span> Back to Dashboard
            </button>
          </div>

          {loading ? (
            <p style={{ marginTop: 16, fontSize: 13, color: "#888780" }}>
              Loading…
            </p>
          ) : error ? (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 13, color: "#2C2C2A", marginBottom: 8 }}>
                Could not load dictionary.
              </p>
              <p style={{ fontSize: 13, color: "#A32D2D" }}>{error}</p>
            </div>
          ) : items.length === 0 ? (
            <p style={{ marginTop: 16, fontSize: 13, color: "#2C2C2A" }}>
              No dictionary data found.
            </p>
          ) : (
            <div style={{ marginTop: 16 }}>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  marginBottom: 10,
                }}
              >
                {Array.from({ length: 26 })
                  .map((_, i) => String.fromCharCode(65 + i))
                  .filter((c) => firstLetterGroups.some(([l]) => l === c))
                  .map((letter) => (
                    <span
                      key={letter}
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#3C3489",
                        background: "#EEEDFE",
                        border: "0.5px solid #AFA9EC",
                        padding: "4px 10px",
                        borderRadius: 999,
                      }}
                    >
                      {letter}
                    </span>
                  ))}
              </div>

              <div
                style={{
                  overflowX: "auto",
                  overflowY: "auto",
                  maxHeight: "55vh",
                  borderRadius: 10,
                }}
              >
                <table
                  style={{
                    width: "100%",

                    borderCollapse: "separate",
                    borderSpacing: 0,
                    fontSize: 13,
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={{
                          textAlign: "left",
                          fontSize: 12,
                          color: "#888780",
                          fontWeight: 600,
                          padding: "10px 10px",
                          borderBottom: "0.5px solid #F1EFE8",
                          whiteSpace: "nowrap",
                        }}
                      >
                        English
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          fontSize: 12,
                          color: "#888780",
                          fontWeight: 600,
                          padding: "10px 10px",
                          borderBottom: "0.5px solid #F1EFE8",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Meaning
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          fontSize: 12,
                          color: "#888780",
                          fontWeight: 600,
                          padding: "10px 10px",
                          borderBottom: "0.5px solid #F1EFE8",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Chinese
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {firstLetterGroups.map(([letter, group]) => (
                      <>
                        <tr key={letter}>
                          <td
                            colSpan={3}
                            style={{
                              padding: "12px 10px 6px",
                              fontSize: 12,
                              fontWeight: 700,
                              color: "#3C3489",
                              borderBottom: "0.5px solid #F1EFE8",
                            }}
                          >
                            {letter}
                          </td>
                        </tr>
                        {group.map((row, idx) => (
                          <tr key={`${row.english}-${idx}`}>
                            <td
                              style={{
                                padding: "10px 10px",
                                borderBottom: "0.5px solid #F1EFE8",
                                fontWeight: 700,
                                color: "#3C3489",
                                whiteSpace: "nowrap",
                                verticalAlign: "top",
                              }}
                            >
                              {row.english}
                            </td>
                            <td
                              style={{
                                padding: "10px 10px",
                                borderBottom: "0.5px solid #F1EFE8",
                                color: "#2C2C2A",
                                verticalAlign: "top",
                              }}
                            >
                              {row.meaning}
                            </td>
                            <td
                              style={{
                                padding: "10px 10px",
                                borderBottom: "0.5px solid #F1EFE8",
                                color: "#2C2C2A",
                                verticalAlign: "top",
                              }}
                            >
                              {row.chinese}
                            </td>
                          </tr>
                        ))}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
