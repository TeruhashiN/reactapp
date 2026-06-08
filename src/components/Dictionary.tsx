import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type DictionaryItem = {
  english: string;
  meaning: string;
  chinese: string;
};

const PER_PAGE = 10;

export default function Dictionary() {
  const navigate = useNavigate();
  const [items, setItems] = useState<DictionaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(true);
  const [jumpPage, setJumpPage] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  // ── Detect mobile ──
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 600px)");
    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      // On mobile default filters to hidden to save space
      if (e.matches) setShowFilters(false);
    };
    setIsMobile(mq.matches);
    if (mq.matches) setShowFilters(false);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // ── Data fetch ──
  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        setCurrentPage(1);
        const res = await fetch("/api/dictionary/english");
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

  // ── Alphabet list ──
  const allLetters = useMemo(() => {
    const letters = new Set<string>();
    for (const it of items) {
      const w = (it.english ?? "").trim();
      if (w) letters.add(w[0].toUpperCase());
    }
    return [...letters].sort();
  }, [items]);

  // ── Filtering ──
  const filteredItems = useMemo(() => {
    let result = items;
    if (selectedLetter) {
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

  const handleSearchChange = useCallback((val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  }, []);

  const handleLetterClick = useCallback((letter: string) => {
    setSelectedLetter((prev) => (prev === letter ? null : letter));
    setCurrentPage(1);
  }, []);

  const clearAll = useCallback(() => {
    setSearchQuery("");
    setSelectedLetter(null);
    setCurrentPage(1);
  }, []);

  const hasActiveFilters = searchQuery || selectedLetter;

  return (
    <div style={s.page}>
      {/* ── Header ── */}
      <div style={s.header}>
        <div style={s.headerInner}>

          {/* Top row: title + back */}
          <div style={s.headerTop}>
            <div>
              <h1 style={s.title}>Dictionary</h1>
              <p style={s.subtitle}>
                {filteredItems.length} term{filteredItems.length !== 1 ? "s" : ""}
                {totalPages > 1 ? ` · Page ${currentPage} of ${totalPages}` : ""}
                {hasActiveFilters ? " · filtered" : ""}
              </p>
            </div>
            <div style={s.headerActions}>
              <button
                type="button"
                style={showFilters ? { ...s.iconBtn, ...s.iconBtnActive } : s.iconBtn}
                onClick={() => setShowFilters((p) => !p)}
                aria-label="Toggle filters"
                aria-expanded={showFilters}
              >
                {/* Filter icon */}
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                {!isMobile && <span>Filters</span>}
                {hasActiveFilters && <span style={s.filterDot} aria-hidden="true" />}
              </button>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                style={s.backBtn}
                aria-label="Back to dashboard"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                {!isMobile && <span>Back</span>}
              </button>
            </div>
          </div>

          {/* Search — always visible */}
          <div style={s.searchWrap}>
            <span style={s.searchIcon}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </span>
            <input
              type="search"
              placeholder={isMobile ? "Search…" : "Search English, meaning, or Chinese…"}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              style={s.searchInput}
              aria-label="Search dictionary"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(""); setCurrentPage(1); }}
                style={s.clearBtn}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Collapsible: alphabet filter */}
          {showFilters && (
            <div style={s.filtersPanel}>
              <div style={s.alphabetList}>
                {allLetters.map((letter) => (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => handleLetterClick(letter)}
                    style={selectedLetter === letter ? s.letterActive : s.letter}
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
                  style={s.clearFilterBtn}
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div style={s.scrollArea}>
        <div style={s.content}>
          {loading ? (
            <div style={s.stateBox}>
              <div style={s.spinner} />
              <p style={s.stateText}>Loading dictionary…</p>
            </div>
          ) : error ? (
            <div style={s.stateBox}>
              <div style={s.errorIcon}>!</div>
              <div>
                <p style={s.errorTitle}>Could not load dictionary</p>
                <p style={s.errorMsg}>{error}</p>
              </div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div style={s.stateBox}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#c5c0b5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12 }}>
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                <path d="m9 7 3 3-3 3" />
              </svg>
              <p style={s.stateText}>No words match your search.</p>
              {hasActiveFilters && (
                <button type="button" onClick={clearAll} style={s.resetBtn}>
                  Reset filters
                </button>
              )}
            </div>
          ) : isMobile ? (
            /* ── Mobile: card list ── */
            <div style={s.cardList}>
              {pageData.map((row, idx) => (
                <div key={`${row.english}-${idx}`} style={s.card}>
                  <div style={s.cardHeader}>
                    <span style={s.cardWord}>{row.english}</span>
                    <span style={s.cardChinese}>{row.chinese}</span>
                  </div>
                  <p style={s.cardMeaning}>{row.meaning}</p>
                </div>
              ))}
            </div>
          ) : (
            /* ── Desktop: table ── */
            <div style={s.tableCard}>
              <table style={s.table}>
                <colgroup>
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "55%" }} />
                  <col style={{ width: "25%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={s.th}>English</th>
                    <th style={s.th}>Meaning</th>
                    <th style={{ ...s.th, textAlign: "center" }}>Chinese</th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((row, idx) => (
                    <TableRow key={`${row.english}-${idx}`} row={row} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div style={s.pagination}>
          <div style={s.paginationInner}>

            {isMobile ? (
              /* Mobile pagination: simple prev / counter / next */
              <div style={s.mobilePagination}>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={currentPage === 1 ? { ...s.pageBtn, opacity: 0.35, cursor: "not-allowed" } : s.pageBtn}
                  aria-label="Previous page"
                >
                  ← Prev
                </button>
                <span style={s.mobilePageCount}>{currentPage} / {totalPages}</span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={currentPage === totalPages ? { ...s.pageBtn, opacity: 0.35, cursor: "not-allowed" } : s.pageBtn}
                  aria-label="Next page"
                >
                  Next →
                </button>
              </div>
            ) : (
              /* Desktop pagination: full numbered + jump */
              <>
                <div style={s.paginationRow}>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={currentPage === 1 ? { ...s.pageBtn, opacity: 0.35, cursor: "not-allowed" } : s.pageBtn}
                  >
                    ← Prev
                  </button>

                  <div style={s.pageNumbers}>
                    {getPageNumbers().map((page, idx) => {
                      if (page === "...") {
                        return <span key={`ellipsis-${idx}`} style={s.ellipsis}>…</span>;
                      }
                      const isCurrent = page === currentPage;
                      return (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setCurrentPage(page as number)}
                          style={isCurrent ? s.pageNumActive : s.pageNum}
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
                    style={currentPage === totalPages ? { ...s.pageBtn, opacity: 0.35, cursor: "not-allowed" } : s.pageBtn}
                  >
                    Next →
                  </button>
                </div>

                <div style={s.jumpRow}>
                  <span style={s.jumpLabel}>Jump to:</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={jumpPage}
                    onChange={(e) => setJumpPage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const p = parseInt(jumpPage, 10);
                        if (!isNaN(p) && p >= 1 && p <= totalPages) {
                          setCurrentPage(p);
                          setJumpPage("");
                        }
                      }
                    }}
                    style={s.jumpInput}
                    aria-label="Jump to page"
                  />
                  <span style={s.jumpTotal}>of {totalPages}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Extracted to avoid inline onMouseEnter/Leave repetition ──
function TableRow({ row }: { row: { english: string; meaning: string; chinese: string } }) {
  const [hovered, setHovered] = useState(false);
  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: hovered ? "#fafaf8" : "#fff" }}
    >
      <td style={s.td}>
        <span style={s.word}>{row.english}</span>
      </td>
      <td style={{ ...s.td, ...s.meaningCell }}>{row.meaning}</td>
      <td style={{ ...s.td, textAlign: "center", whiteSpace: "nowrap" }}>
        <span style={s.chinese}>{row.chinese}</span>
      </td>
    </tr>
  );
}

// ── Styles ──
const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    height: "100vh",
    background: "linear-gradient(180deg, #f5f4f0 0%, #ece9e3 100%)",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },

  // ── Header ──
  header: {
    background: "#fff",
    borderBottom: "0.5px solid #D3D1C7",
    flexShrink: 0,
    position: "sticky",
    top: 0,
    zIndex: 10,
    boxShadow: "0 2px 8px rgba(60, 52, 137, 0.04)",
  },
  headerInner: {
    maxWidth: 960,
    margin: "0 auto",
    padding: "14px 16px",
  },
  headerTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
    color: "#1a1625",
    letterSpacing: "-0.01em",
  },
  subtitle: {
    fontSize: 12,
    color: "#7a756a",
    margin: "3px 0 0",
  },
  headerActions: {
    display: "flex",
    gap: 6,
    alignItems: "center",
    flexShrink: 0,
  },
  iconBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "8px 12px",
    background: "#fff",
    border: "0.5px solid #e5e2da",
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 600,
    color: "#3C3489",
    cursor: "pointer",
    position: "relative",
    minHeight: 36,
    minWidth: 36,
    justifyContent: "center",
  },
  iconBtnActive: {
    background: "#EEEDFE",
    borderColor: "#AFA9EC",
  },
  filterDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#3C3489",
  },
  backBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "8px 12px",
    background: "#fff",
    border: "0.5px solid #e5e2da",
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 600,
    color: "#3C3489",
    cursor: "pointer",
    minHeight: 36,
    minWidth: 36,
    justifyContent: "center",
  },

  // ── Search ──
  searchWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    marginBottom: 0,
  },
  searchIcon: {
    position: "absolute",
    left: 12,
    color: "#9a9488",
    display: "flex",
    alignItems: "center",
    pointerEvents: "none",
  },
  searchInput: {
    width: "100%",
    padding: "10px 36px 10px 38px",
    border: "0.5px solid #e5e2da",
    borderRadius: 10,
    fontSize: 14,
    background: "#fafaf8",
    color: "#1a1625",
    outline: "none",
    boxSizing: "border-box",
    minHeight: 40,
  },
  clearBtn: {
    position: "absolute",
    right: 10,
    background: "none",
    border: "none",
    color: "#9a9488",
    cursor: "pointer",
    fontSize: 13,
    padding: "6px",
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    minHeight: 32,
    minWidth: 32,
    justifyContent: "center",
  },

  // ── Filters panel ──
  filtersPanel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 10,
    paddingTop: 10,
    borderTop: "0.5px solid #f0ede6",
  },
  alphabetList: {
    display: "flex",
    gap: 4,
    flexWrap: "wrap",
    flex: 1,
  },
  letter: {
    minWidth: 32,
    height: 32,
    padding: "0 8px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "0.5px solid #e5e2da",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    color: "#5a554c",
    background: "#fff",
    cursor: "pointer",
    minHeight: 32,   // accessible tap target
  },
  letterActive: {
    minWidth: 32,
    height: 32,
    padding: "0 8px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "0.5px solid #AFA9EC",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    color: "#3C3489",
    background: "#EEEDFE",
    cursor: "pointer",
    minHeight: 32,
  },
  clearFilterBtn: {
    background: "none",
    border: "0.5px solid #e5e2da",
    borderRadius: 8,
    color: "#3C3489",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    padding: "6px 10px",
    flexShrink: 0,
    minHeight: 32,
  },

  // ── Scroll area ──
  scrollArea: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 16px 0",
  },
  content: {
    maxWidth: 960,
    margin: "0 auto",
    paddingBottom: 16,
  },

  // ── States ──
  stateBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 20px",
    background: "#fff",
    border: "0.5px solid #D3D1C7",
    borderRadius: 14,
    textAlign: "center",
    gap: 0,
  },
  spinner: {
    width: 28,
    height: 28,
    border: "2.5px solid #e5e2da",
    borderTopColor: "#3C3489",
    borderRadius: "50%",
    marginBottom: 12,
    animation: "spin 0.8s linear infinite",
  },
  stateText: {
    fontSize: 14,
    color: "#7a756a",
    margin: 0,
  },
  errorIcon: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    background: "#fef2f2",
    color: "#dc2626",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 15,
    fontWeight: 700,
    flexShrink: 0,
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: "#1a1625",
    margin: "0 0 4px",
  },
  errorMsg: {
    fontSize: 12,
    color: "#dc2626",
    margin: 0,
  },
  resetBtn: {
    marginTop: 14,
    background: "#3C3489",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "9px 18px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },

  // ── Desktop table ──
  tableCard: {
    background: "#fff",
    border: "0.5px solid #D3D1C7",
    borderRadius: 14,
    overflow: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
  },
  th: {
    textAlign: "left" as const,
    padding: "10px 16px",
    fontSize: 10,
    fontWeight: 700,
    color: "#7a756a",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    background: "#fafaf8",
    borderBottom: "0.5px solid #e5e2da",
    // Sticky column headers
    position: "sticky" as const,
    top: 0,
    zIndex: 1,
  },
  td: {
    padding: "10px 16px",
    borderBottom: "0.5px solid #f1efe8",
    fontSize: 13,
    color: "#2C2C2A",
    verticalAlign: "middle" as const,
    transition: "background 0.1s",
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

  // ── Mobile cards ──
  cardList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  card: {
    background: "#fff",
    border: "0.5px solid #D3D1C7",
    borderRadius: 12,
    padding: "12px 14px",
  },
  cardHeader: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 5,
  },
  cardWord: {
    fontWeight: 700,
    color: "#3C3489",
    fontSize: 15,
  },
  cardChinese: {
    fontSize: 14,
    color: "#5a554c",
    fontWeight: 500,
    flexShrink: 0,
  },
  cardMeaning: {
    fontSize: 13,
    color: "#5a554c",
    lineHeight: 1.55,
    margin: 0,
  },

  // ── Pagination ──
  pagination: {
    flexShrink: 0,
    background: "#fff",
    borderTop: "0.5px solid #e5e2da",
    padding: "12px 16px",
    boxShadow: "0 -2px 8px rgba(60, 52, 137, 0.04)",
  },
  paginationInner: {
    maxWidth: 960,
    margin: "0 auto",
  },
  paginationRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  mobilePagination: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  mobilePageCount: {
    fontSize: 13,
    fontWeight: 600,
    color: "#3C3489",
    minWidth: 60,
    textAlign: "center",
  },
  pageBtn: {
    background: "#fff",
    border: "0.5px solid #D3D1C7",
    borderRadius: 10,
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 600,
    color: "#3C3489",
    cursor: "pointer",
    minHeight: 36,
  },
  pageNumbers: {
    display: "flex",
    gap: 4,
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
  },
  pageNum: {
    minWidth: 34,
    height: 34,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "0.5px solid #e5e2da",
    borderRadius: 9,
    fontSize: 13,
    fontWeight: 600,
    color: "#5a554c",
    background: "#fff",
    cursor: "pointer",
    padding: "0 8px",
  },
  pageNumActive: {
    minWidth: 34,
    height: 34,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "0.5px solid #AFA9EC",
    borderRadius: 9,
    fontSize: 13,
    fontWeight: 700,
    color: "#3C3489",
    background: "#EEEDFE",
    cursor: "pointer",
    padding: "0 8px",
  },
  ellipsis: {
    width: 28,
    height: 34,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    color: "#9a9488",
  },
  jumpRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
  },
  jumpLabel: {
    fontSize: 12,
    color: "#7a756a",
    fontWeight: 500,
  },
  jumpInput: {
    width: 52,
    padding: "4px 6px",
    border: "0.5px solid #e5e2da",
    borderRadius: 7,
    fontSize: 12,
    textAlign: "center" as const,
    outline: "none",
    background: "#fafaf8",
    color: "#1a1625",
  },
  jumpTotal: {
    fontSize: 12,
    color: "#5a554c",
  },
};