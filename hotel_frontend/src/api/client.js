const DEFAULT_BASE_URL = process.env.REACT_APP_API_BASE_URL || "";

/**
 * Helper to build a stable absolute URL to backend.
 * If REACT_APP_API_BASE_URL is empty, requests become relative.
 */
function buildUrl(path, params) {
  const url = new URL(path, DEFAULT_BASE_URL || window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") return;
      url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

async function safeJson(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

// --- Mock dataset (used if backend doesn't implement hotel endpoints yet) ---
const MOCK_HOTELS = [
  {
    id: "htl_001",
    name: "Azure Bay Hotel",
    location: "San Diego, CA",
    pricePerNight: 189,
    rating: 4.6,
    reviewCount: 842,
    amenities: ["Free Wi‑Fi", "Pool", "Breakfast", "Gym"],
    photos: [
      "https://images.unsplash.com/photo-1501117716987-c8e1ecb210ff?auto=format&fit=crop&w=1200&q=70",
      "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1200&q=70",
    ],
    description:
      "Coastal comfort with modern rooms, walkable access to the waterfront, and a bright pool deck.",
  },
  {
    id: "htl_002",
    name: "Cedar & Stone Suites",
    location: "Denver, CO",
    pricePerNight: 149,
    rating: 4.3,
    reviewCount: 410,
    amenities: ["Free Wi‑Fi", "Kitchenette", "Parking"],
    photos: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=70",
      "https://images.unsplash.com/photo-1560067174-8943bd5d6b3b?auto=format&fit=crop&w=1200&q=70",
    ],
    description:
      "Spacious suites with kitchenettes—ideal for longer stays. Easy access to downtown and trails.",
  },
  {
    id: "htl_003",
    name: "Riverside Grand",
    location: "Austin, TX",
    pricePerNight: 219,
    rating: 4.7,
    reviewCount: 1250,
    amenities: ["Pool", "Breakfast", "Pet Friendly", "Gym"],
    photos: [
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=70",
      "https://images.unsplash.com/photo-1551887373-6b21b4c9c5c9?auto=format&fit=crop&w=1200&q=70",
    ],
    description:
      "Upscale downtown stay with river views, rooftop pool, and quick access to food and music venues.",
  },
];

function filterMockHotels(filters) {
  const q = (filters?.q || "").toLowerCase().trim();
  const min = Number(filters?.minPrice ?? "");
  const max = Number(filters?.maxPrice ?? "");
  const requiredAmenities = Array.isArray(filters?.amenities)
    ? filters.amenities
    : [];

  return MOCK_HOTELS.filter((h) => {
    const matchesQ =
      !q ||
      h.name.toLowerCase().includes(q) ||
      h.location.toLowerCase().includes(q);

    const matchesMin = Number.isFinite(min) ? h.pricePerNight >= min : true;
    const matchesMax = Number.isFinite(max) ? h.pricePerNight <= max : true;

    const matchesAmenities =
      requiredAmenities.length === 0
        ? true
        : requiredAmenities.every((a) => h.amenities.includes(a));

    return matchesQ && matchesMin && matchesMax && matchesAmenities;
  });
}

// PUBLIC_INTERFACE
export async function healthCheck() {
  /** Health check against backend root. */
  const res = await fetch(buildUrl("/"), { method: "GET" });
  if (!res.ok) throw new Error(`Health check failed (${res.status})`);
  return safeJson(res);
}

// PUBLIC_INTERFACE
export async function searchHotels(filters) {
  /**
   * Search hotels using backend if available; otherwise use mock data.
   * Expected future backend: GET /hotels?q=&checkIn=&checkOut=&minPrice=&maxPrice=&amenities=
   */
  try {
    const res = await fetch(
      buildUrl("/hotels", {
        q: filters?.q,
        checkIn: filters?.checkIn,
        checkOut: filters?.checkOut,
        minPrice: filters?.minPrice,
        maxPrice: filters?.maxPrice,
        amenities: Array.isArray(filters?.amenities)
          ? filters.amenities.join(",")
          : undefined,
      }),
      { method: "GET" }
    );

    if (!res.ok) throw new Error(`Backend search not available (${res.status})`);
    const data = await safeJson(res);
    if (!data) throw new Error("Empty response");
    return data;
  } catch {
    // Fallback to mock
    return {
      source: "mock",
      results: filterMockHotels(filters),
    };
  }
}

// PUBLIC_INTERFACE
export async function getHotelById(hotelId) {
  /**
   * Get hotel details using backend if available; otherwise use mock data.
   * Expected future backend: GET /hotels/{hotelId}
   */
  try {
    const res = await fetch(buildUrl(`/hotels/${hotelId}`), { method: "GET" });
    if (!res.ok) throw new Error(`Backend detail not available (${res.status})`);
    const data = await safeJson(res);
    if (!data) throw new Error("Empty response");
    return data;
  } catch {
    const found = MOCK_HOTELS.find((h) => h.id === hotelId);
    if (!found) {
      const err = new Error("Hotel not found");
      err.status = 404;
      throw err;
    }
    return { source: "mock", hotel: found };
  }
}

// PUBLIC_INTERFACE
export async function createBooking(payload) {
  /**
   * Create a booking.
   * Expected future backend: POST /bookings { hotelId, fullName, email, checkIn, checkOut, guests }
   *
   * Until backend exists, returns a mock confirmation.
   */
  try {
    const res = await fetch(buildUrl("/bookings"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload ?? {}),
    });
    if (!res.ok) throw new Error(`Backend booking not available (${res.status})`);
    const data = await safeJson(res);
    if (!data) throw new Error("Empty response");
    return data;
  } catch {
    // Mock confirmation
    return {
      source: "mock",
      bookingId: `bk_${Math.random().toString(16).slice(2, 10)}`,
      status: "confirmed",
      createdAt: new Date().toISOString(),
      ...payload,
    };
  }
}
