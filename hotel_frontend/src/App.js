import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import { getHotelById, healthCheck, searchHotels } from "./api/client";
import { Navbar } from "./components/Navbar";
import { HotelCard } from "./components/HotelCard";
import { BookingModal } from "./components/BookingModal";

const AMENITIES = ["Free Wi‑Fi", "Pool", "Breakfast", "Gym", "Parking", "Pet Friendly", "Kitchenette"];

function normalizeResults(data) {
  // Our mock returns: { source, results: [...] }
  if (Array.isArray(data)) return data;
  if (data?.results && Array.isArray(data.results)) return data.results;
  if (data?.items && Array.isArray(data.items)) return data.items;
  return [];
}

// PUBLIC_INTERFACE
function App() {
  /** Main application entrypoint for hotel search, details, and booking flow. */
  const [theme, setTheme] = useState("light");

  const [apiStatus, setApiStatus] = useState({ state: "unknown", message: "" }); // unknown|ok|down
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    q: "",
    checkIn: "",
    checkOut: "",
    minPrice: "",
    maxPrice: "",
    amenities: [],
  });

  const [results, setResults] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [error, setError] = useState("");

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Probe backend health so the user knows if we're on mock mode.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await healthCheck();
        if (cancelled) return;
        setApiStatus({ state: "ok", message: data?.message || "Healthy" });
      } catch (e) {
        if (cancelled) return;
        setApiStatus({ state: "down", message: "Using mock data (backend hotel endpoints not available)" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedAmenitiesSet = useMemo(() => new Set(filters.amenities), [filters.amenities]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    /** Toggle between light/dark theme variables. */
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  async function runSearch(e) {
    if (e) e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await searchHotels(filters);
      const normalized = normalizeResults(data);
      setResults(normalized);
      setSelectedHotel(null);
    } catch (err) {
      setError(err?.message || "Search failed.");
    } finally {
      setLoading(false);
    }
  }

  async function selectHotel(hotelId) {
    setError("");
    setLoading(true);
    try {
      const data = await getHotelById(hotelId);
      const hotel = data?.hotel || data?.result || data;
      setSelectedHotel(hotel);
      // scroll to top of details on mobile
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err?.message || "Failed to load hotel details.");
    } finally {
      setLoading(false);
    }
  }

  function toggleAmenity(a) {
    setFilters((prev) => {
      const next = new Set(prev.amenities);
      if (next.has(a)) next.delete(a);
      else next.add(a);
      return { ...prev, amenities: Array.from(next) };
    });
  }

  const cover = selectedHotel?.photos?.[0];

  return (
    <div className="App">
      <Navbar title="Hotel Finder">
        <div className="navbar__right">
          <div
            className={`badge ${apiStatus.state === "ok" ? "badge--ok" : "badge--warn"}`}
            role="status"
            aria-label="API status"
            title="Backend status"
          >
            {apiStatus.state === "ok" ? "API: OK" : "API: Mock"}
          </div>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            type="button"
          >
            {theme === "light" ? "Dark" : "Light"}
          </button>
        </div>
      </Navbar>

      <div className="page">
        <aside className="sidebar" aria-label="Search filters">
          <form className="panel" onSubmit={runSearch}>
            <div className="panel__title">Search</div>

            <label className="field">
              <span className="field__label">Location or hotel</span>
              <input
                className="input"
                value={filters.q}
                onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
                placeholder="e.g. Austin, TX"
              />
            </label>

            <div className="grid2">
              <label className="field">
                <span className="field__label">Check-in</span>
                <input
                  type="date"
                  className="input"
                  value={filters.checkIn}
                  onChange={(e) => setFilters((p) => ({ ...p, checkIn: e.target.value }))}
                />
              </label>

              <label className="field">
                <span className="field__label">Check-out</span>
                <input
                  type="date"
                  className="input"
                  value={filters.checkOut}
                  onChange={(e) => setFilters((p) => ({ ...p, checkOut: e.target.value }))}
                />
              </label>
            </div>

            <div className="grid2">
              <label className="field">
                <span className="field__label">Min price</span>
                <input
                  type="number"
                  className="input"
                  value={filters.minPrice}
                  onChange={(e) => setFilters((p) => ({ ...p, minPrice: e.target.value }))}
                  placeholder="0"
                  min={0}
                />
              </label>

              <label className="field">
                <span className="field__label">Max price</span>
                <input
                  type="number"
                  className="input"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters((p) => ({ ...p, maxPrice: e.target.value }))}
                  placeholder="500"
                  min={0}
                />
              </label>
            </div>

            <div className="field">
              <div className="field__label">Amenities</div>
              <div className="amenities">
                {AMENITIES.map((a) => (
                  <button
                    key={a}
                    type="button"
                    className={`chip chip--selectable ${selectedAmenitiesSet.has(a) ? "chip--active" : ""}`}
                    onClick={() => toggleAmenity(a)}
                    aria-pressed={selectedAmenitiesSet.has(a)}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div className="panel__actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Searching..." : "Search"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setFilters({ q: "", checkIn: "", checkOut: "", minPrice: "", maxPrice: "", amenities: [] });
                  setResults([]);
                  setSelectedHotel(null);
                }}
              >
                Reset
              </button>
            </div>

            {error ? (
              <div className="alert alert--error" role="alert">
                {error}
              </div>
            ) : null}
          </form>
        </aside>

        <main className="content" aria-label="Search results and hotel details">
          {selectedHotel ? (
            <div className="panel">
              <div className="detail">
                <div className="detail__hero">
                  {cover ? (
                    <img className="detail__img" src={cover} alt={selectedHotel.name} />
                  ) : (
                    <div className="detail__placeholder">No image</div>
                  )}

                  <div className="detail__heroInfo">
                    <div className="detail__titleRow">
                      <div>
                        <div className="detail__name">{selectedHotel.name}</div>
                        <div className="detail__sub">
                          {selectedHotel.location} • {selectedHotel.rating} ({selectedHotel.reviewCount})
                        </div>
                      </div>
                      <div className="detail__price">
                        <div className="detail__priceValue">${selectedHotel.pricePerNight}</div>
                        <div className="detail__priceUnit">per night</div>
                      </div>
                    </div>

                    <div className="detail__amenities">
                      {(selectedHotel.amenities || []).map((a) => (
                        <span key={a} className="chip">
                          {a}
                        </span>
                      ))}
                    </div>

                    <div className="detail__desc">{selectedHotel.description}</div>

                    <div className="detail__actions">
                      <button type="button" className="btn btn-secondary" onClick={() => setSelectedHotel(null)}>
                        Back to results
                      </button>
                      <button type="button" className="btn btn-primary" onClick={() => setBookingOpen(true)}>
                        Book
                      </button>
                    </div>
                  </div>
                </div>

                {Array.isArray(selectedHotel.photos) && selectedHotel.photos.length > 1 ? (
                  <div className="gallery" aria-label="Photo gallery">
                    {selectedHotel.photos.slice(0, 6).map((src) => (
                      <img key={src} className="gallery__img" src={src} alt={`${selectedHotel.name} photo`} />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="panel">
              <div className="panel__title">Results</div>
              {results.length === 0 ? (
                <div className="empty">
                  <div className="empty__title">Search for hotels</div>
                  <div className="empty__text">
                    Use the filters on the left to find stays by location, price, and amenities.
                  </div>
                </div>
              ) : (
                <div className="results">
                  {results.map((h) => (
                    <HotelCard key={h.id} hotel={h} onSelect={selectHotel} />
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <BookingModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        hotel={selectedHotel}
        initialSearch={filters}
      />
    </div>
  );
}

export default App;
