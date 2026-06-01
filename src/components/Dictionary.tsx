import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const STYLE_ID = "dictionary-mobile-filter-styles";

export default function Dictionary() {
  const navigate = useNavigate();
  const [items, setItems] = useState<DictionaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(window.innerWidth < 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const PER_PAGE = 10;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        setCurrentPage(1);
        const res = await fetch("http://localhost:4000/api/dictionary/english");
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || `Request failed: ${res.status}`);
        }
        const data: { items: DictionaryItem[] } = await res.json();
        const sorted = [...(data.items ?? [])].sort((a, b) => {
          const aw = (a.english ?? "").toString().trim().toLowerCase();
          const bw = (b.english ?? "").toString().trim().toLowerCase();
          return aw.localeCompare(bw);
        });
        setItems(sorted);
      } catch (e: unknown) {
        setItems([]);
        setError((e as Error)?.message || "Failed to load dictionary");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const allLetters = useMemo(() => {
    const letters = new Set<string>();
    for (const it of items) {
      const w = (it.english ?? "").trim();
      if (w) letters.add(w[0].toUpperCase());
    }
    return ["All", ...[...letters].sort()];
  }, [items]);

  const filteredItems = useMemo(() => {
    let result = items;
    if (selectedLetter && selectedLetter !== "All") {
      result = result.filter((it) => {
        const w = (it.english ?? "").trim();
        return w ? w[0].toUpperCase() === selectedLetter : false;
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (it) =>
          (it.english ?? "").toLowerCase().includes(q) ||
          (it.meaning ?? "").toLowerCase().includes(q) ||
          (it.chinese ?? "").includes(searchQuery.trim())
      );
    }
    return result;
  }, [items, selectedLetter, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedLetter, searchQuery]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredItems.length / PER_PAGE)),
    [filteredItems.length]
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const pageData = useMemo(() => {
    const start = (currentPage - 1) * PER_PAGE;
    return filteredItems.slice(start, start + PER_PAGE);
  }, [filteredItems, currentPage]);

  const getPageNumbers = useCallback((): (number | "...")[] => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  }, [currentPage, totalPages]);

  // ── Handlers (were missing — caused filter buttons to silently fail) ──
  const handleSearchChange = useCallback((val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  }, []);

  const handleLetterClick = useCallback((letter: string) => {
    setSelectedLetter((prev) => (prev === letter ? null : letter));
    setCurrentPage(1);
  }, []);

  return (
    <div style={styles.page}>
      {/* Fixed header */}
      <div style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.headerTop}>
            <div>
              <h1 style={styles.title}>Dictionary</h1>
              <p style={styles.subtitle}>
                English · Meaning · Chinese — {filteredItems.length} terms
                {totalPages > 1 ? ` · Page ${currentPage} of ${totalPages}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              style={styles.backBtn}
              aria-label="Back to dashboard"
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#EEEDFE";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 6px 16px rgba(60, 52, 137, 0.12)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#fff";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
              }}
            >
              <span aria-hidden="true" style={{ fontSize: 14 }}>←</span>
              <span>Back</span>
            </button>
          </div>

          {isMobile && (
            <button
              type="button"
              onClick={() => setShowFilters((prev) => !prev)}
              style={styles.filterToggleBtn}
              aria-expanded={showFilters}
            >
              {showFilters ? "Hide filters" : "Show filters"}
            </button>
          )}

          {(showFilters || !isMobile) && (
            <>
              {/* Search */}
              <div style={styles.searchWrap}>
                <span style={styles.searchIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search English, meaning, or Chinese..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  style={styles.searchInput}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(""); setCurrentPage(1); }}
                    style={styles.clearBtn}
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Alphabet filter */}
              <div style={styles.alphabetWrap}>
                <div style={styles.alphabetList}>
                  {allLetters.map((letter) => (
                    <button
                      key={letter}
                      onClick={() => handleLetterClick(letter)}
                      style={
                        selectedLetter === letter
                          ? letter === "All"
                            ? styles.letterAllActive
                            : styles.letterActive
                          : letter === "All"
                            ? styles.letterAll
                            : styles.letter
                      }
                      aria-pressed={selectedLetter === letter}
                    >
                      {letter}
                    </button>
                  ))}
                </div>
                {selectedLetter && (
                  <button
                    type="button"
                    onClick={() => { setSelectedLetter(null); setCurrentPage(1); }}
                    style={styles.clearFilterBtn}
                  >
                    Clear filter
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Scrollable table + pagination */}
      <div style={styles.tableArea}>
        <div style={styles.content}>
          {loading ? (
            <div style={styles.stateWrap}>
              <div style={styles.spinner} />
              <p style={styles.stateText}>Loading dictionary…</p>
            </div>
          ) : error ? (
            <div style={styles.errorWrap}>
              <div style={styles.errorIcon}>!</div>
              <div>
                <p style={styles.errorTitle}>Could not load dictionary</p>
                <p style={styles.errorMsg}>{error}</p>
              </div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div style={styles.stateWrap}>
              <div style={styles.emptyIcon}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                  <path d="m9 7 3 3-3 3" />
                </svg>
              </div>
              <p style={styles.stateText}>
                {searchQuery || selectedLetter ? "No words match your search." : "No dictionary data found."}
              </p>
              {(searchQuery || selectedLetter) && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(""); setSelectedLetter(null); setCurrentPage(1); }}
                  style={styles.resetBtn}
                >
                  Reset filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div style={styles.tableCard}>
                <table style={styles.table}>
                  <colgroup>
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "55%" }} />
                    <col style={{ width: "25%" }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th style={styles.th}>English</th>
                      <th style={styles.th}>Meaning</th>
                      <th style={{ ...styles.th, textAlign: "center" }}>Chinese</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageData.map((row, idx) => (
                      <tr
                        key={`${row.english}-${idx}`}
                        style={styles.tr}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLTableRowElement).style.background = "#fafaf8";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLTableRowElement).style.background = "#fff";
                        }}
                      >
                        <td style={styles.td}>
                          <span style={styles.word}>{row.english}</span>
                        </td>
                        <td style={{ ...styles.td, ...styles.meaningCell }}>
                          {row.meaning}
                        </td>
                        <td style={{ ...styles.td, textAlign: "center", whiteSpace: "nowrap" }}>
                          <span style={styles.chinese}>{row.chinese}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={styles.paginationWrap}>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={
                      currentPage === 1
                        ? { ...styles.pageBtn, opacity: 0.35, cursor: "not-allowed" }
                        : styles.pageBtn
                    }
                  >
                    ← Prev
                  </button>

                  <div style={styles.pageNumbers}>
                    {getPageNumbers().map((page, idx) => {
                      const isCurrent = page === currentPage;
                      if (page === "...") {
                        return (
                          <span key={`ellipsis-${idx}`} style={styles.ellipsis}>
                            …
                          </span>
                        );
                      }
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page as number)}
                          style={isCurrent ? styles.pageNumActive : styles.pageNum}
                          aria-current={isCurrent ? "page" : undefined}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    style={
                      currentPage === totalPages
                        ? { ...styles.pageBtn, opacity: 0.35, cursor: "not-allowed" }
                        : styles.pageBtn
                    }
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f5f4f0 0%, #ece9e3 100%)",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    display: "flex",
    flexDirection: "column",
    height: "100vh",
  },
  header: {
    background: "#fff",
    borderBottom: "0.5px solid #D3D1C7",
    flexShrink: 0,
    boxShadow: "0 2px 8px rgba(60, 52, 137, 0.04)",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  headerInner: {
    maxWidth: 960,
    margin: "0 auto",
    padding: "20px 24px",
  },
  headerTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    margin: 0,
    color: "#1a1625",
    letterSpacing: "-0.01em",
  },
  filterToggleBtn: {
    alignSelf: "flex-start",
    background: "#fff",
    border: "0.5px solid #D3D1C7",
    borderRadius: 10,
    padding: "7px 12px",
    fontSize: 12,
    fontWeight: 600,
    color: "#3C3489",
    cursor: "pointer",
    marginBottom: 8,
    display: "inline-flex",
  },
  subtitle: {
    color: "#7a756a",
    marginTop: 6,
    marginBottom: 0,
    fontSize: 13,
    fontWeight: 500,
  },
  backBtn: {
    border: "0.5px solid #D3D1C7",
    background: "#fff",
    padding: "9px 14px",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    color: "#3C3489",
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    whiteSpace: "nowrap",
    transition: "transform 0.12s ease, box-shadow 0.12s ease, background 0.12s ease",
  },
  searchWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    marginBottom: 14,
  },
  searchIcon: {
    position: "absolute",
    left: 14,
    color: "#9a9488",
    display: "flex",
    alignItems: "center",
    pointerEvents: "none",
  },
  searchInput: {
    width: "100%",
    padding: "12px 40px 12px 42px",
    border: "1.5px solid #e5e2da",
    borderRadius: 12,
    fontSize: 14,
    background: "#fafaf8",
    color: "#1a1625",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  },
  clearBtn: {
    position: "absolute",
    right: 12,
    background: "none",
    border: "none",
    color: "#9a9488",
    cursor: "pointer",
    fontSize: 14,
    padding: 4,
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    lineHeight: 1,
  },
  alphabetWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  alphabetList: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
  },
  letter: {
    minWidth: 34,
    height: 34,
    padding: "0 10px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "0.5px solid #e5e2da",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    color: "#5a554c",
    background: "#fff",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  letterAll: {
    minWidth: 50,
    height: 34,
    padding: "0 10px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "0.5px solid #e5e2da",
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 700,
    color: "#3C3489",
    background: "#fff",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  letterActive: {
    minWidth: 34,
    height: 34,
    padding: "0 10px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "0.5px solid #AFA9EC",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 700,
    color: "#3C3489",
    background: "#EEEDFE",
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(60, 52, 137, 0.10)",
  },
  letterAllActive: {
    minWidth: 50,
    height: 34,
    padding: "0 10px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "0.5px solid #AFA9EC",
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 700,
    color: "#3C3489",
    background: "#EEEDFE",
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(60, 52, 137, 0.10)",
  },
  clearFilterBtn: {
    background: "none",
    border: "none",
    color: "#3C3489",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: 6,
  },
  tableArea: {
    flex: 1,
    overflowY: "auto",
    padding: "20px 16px 40px",
    background: "linear-gradient(180deg, #f5f4f0 0%, #ece9e3 100%)",
  },
  content: {
    maxWidth: 960,
    margin: "0 auto",
  },
  stateWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 20px",
    background: "#fff",
    border: "0.5px solid #D3D1C7",
    borderRadius: 16,
    textAlign: "center",
  },
  spinner: {
    width: 32,
    height: 32,
    border: "3px solid #e5e2da",
    borderTopColor: "#3C3489",
    borderRadius: "50%",
    marginBottom: 14,
    animation: "spin 0.8s linear infinite",
  },
  stateText: {
    fontSize: 14,
    color: "#7a756a",
    margin: 0,
  },
  errorWrap: {
    display: "flex",
    alignItems: "flex-start",
    gap: 14,
    padding: "20px 22px",
    background: "#fff",
    border: "0.5px solid #D3D1C7",
    borderRadius: 16,
  },
  errorIcon: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "#fef2f2",
    color: "#dc2626",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    fontWeight: 700,
    flexShrink: 0,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "#1a1625",
    margin: "0 0 4px",
  },
  errorMsg: {
    fontSize: 13,
    color: "#dc2626",
    margin: 0,
  },
  emptyIcon: {
    color: "#c5c0b5",
    marginBottom: 14,
    display: "flex",
  },
  resetBtn: {
    marginTop: 12,
    background: "#3C3489",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "9px 18px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(60, 52, 137, 0.18)",
  },
  tableCard: {
    background: "#fff",
    border: "0.5px solid #D3D1C7",
    borderRadius: 14,
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(60, 52, 137, 0.04)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
  },
  th: {
    textAlign: "left" as const,
    padding: "12px 16px",
    fontSize: 11,
    fontWeight: 700,
    color: "#7a756a",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    background: "#fafaf8",
    borderBottom: "0.5px solid #e5e2da",
  },
  tr: {
    transition: "background 0.15s ease",
  },
  td: {
    padding: "10px 16px",
    borderBottom: "0.5px solid #f1efe8",
    fontSize: 13,
    color: "#2C2C2A",
    verticalAlign: "middle" as const,
  },
  meaningCell: {
    whiteSpace: "normal" as const,
    wordBreak: "break-word" as const,
    lineHeight: 1.55,
    color: "#3d3a34",
  },
  word: {
    fontWeight: 700,
    color: "#3C3489",
    fontSize: 13,
  },
  chinese: {
    fontWeight: 500,
    fontSize: 13,
    color: "#2C2C2A",
  },
  paginationWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 20,
    flexWrap: "wrap",
  },
  pageBtn: {
    background: "#fff",
    border: "0.5px solid #D3D1C7",
    borderRadius: 10,
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 600,
    color: "#3C3489",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  pageNumbers: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
  },
  pageNum: {
    minWidth: 36,
    height: 36,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "0.5px solid #e5e2da",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    color: "#5a554c",
    background: "#fff",
    cursor: "pointer",
    padding: "0 10px",
    transition: "all 0.15s ease",
  },
  pageNumActive: {
    minWidth: 36,
    height: 36,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "0.5px solid #AFA9EC",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 700,
    color: "#3C3489",
    background: "#EEEDFE",
    cursor: "pointer",
    padding: "0 10px",
    boxShadow: "0 2px 6px rgba(60, 52, 137, 0.10)",
  },
  ellipsis: {
    width: 36,
    height: 36,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 600,
    color: "#5a554c",
  },
};