import React, { useEffect, useMemo, useState } from "react";
import { createBooking } from "../api/client";

function nightsBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  const diff = b.getTime() - a.getTime();
  const nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return Math.max(0, nights);
}

// PUBLIC_INTERFACE
export function BookingModal({ open, onClose, hotel, initialSearch }) {
  /** Modal dialog to collect booking details and submit booking request. */
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [error, setError] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [guests, setGuests] = useState(2);
  const [checkIn, setCheckIn] = useState(initialSearch?.checkIn || "");
  const [checkOut, setCheckOut] = useState(initialSearch?.checkOut || "");

  useEffect(() => {
    if (!open) return;
    setStatus("idle");
    setError("");
  }, [open]);

  const nights = useMemo(() => nightsBetween(checkIn, checkOut), [checkIn, checkOut]);
  const total = useMemo(() => (nights ? nights * (hotel?.pricePerNight || 0) : 0), [
    nights,
    hotel,
  ]);

  if (!open) return null;

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (!hotel?.id) {
      setError("Missing hotel selection.");
      setStatus("error");
      return;
    }
    if (!fullName.trim()) {
      setError("Please enter your full name.");
      setStatus("error");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      setStatus("error");
      return;
    }
    if (!checkIn || !checkOut) {
      setError("Please choose check-in and check-out dates.");
      setStatus("error");
      return;
    }
    if (nights <= 0) {
      setError("Check-out must be after check-in.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    try {
      await createBooking({
        hotelId: hotel.id,
        fullName: fullName.trim(),
        email: email.trim(),
        guests: Number(guests),
        checkIn,
        checkOut,
      });
      setStatus("success");
    } catch (err) {
      setError(err?.message || "Booking failed.");
      setStatus("error");
    }
  }

  return (
    <div className="modal__backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Book ${hotel?.name || "hotel"}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal__header">
          <div>
            <div className="modal__title">Complete your booking</div>
            <div className="modal__subtitle">{hotel?.name}</div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {status === "success" ? (
          <div className="modal__content">
            <div className="alert alert--success" role="status">
              Booking confirmed (mock)!
            </div>
            <div className="modal__actions">
              <button type="button" className="btn btn-primary" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="modal__content">
            {error ? (
              <div className="alert alert--error" role="alert">
                {error}
              </div>
            ) : null}

            <div className="grid2">
              <label className="field">
                <span className="field__label">Full name</span>
                <input
                  className="input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                  autoComplete="name"
                />
              </label>

              <label className="field">
                <span className="field__label">Email</span>
                <input
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  autoComplete="email"
                />
              </label>

              <label className="field">
                <span className="field__label">Check-in</span>
                <input
                  type="date"
                  className="input"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                />
              </label>

              <label className="field">
                <span className="field__label">Check-out</span>
                <input
                  type="date"
                  className="input"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </label>

              <label className="field">
                <span className="field__label">Guests</span>
                <input
                  type="number"
                  className="input"
                  min={1}
                  max={10}
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                />
              </label>

              <div className="price-box" aria-label="Price summary">
                <div className="price-box__row">
                  <span>Nights</span>
                  <span>{nights || "—"}</span>
                </div>
                <div className="price-box__row">
                  <span>Total</span>
                  <span className="price-box__total">${total || "—"}</span>
                </div>
              </div>
            </div>

            <div className="modal__actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={status === "submitting"}
              >
                {status === "submitting" ? "Booking..." : "Book now"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
