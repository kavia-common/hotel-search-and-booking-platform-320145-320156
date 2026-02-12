import React from "react";

// PUBLIC_INTERFACE
export function HotelCard({ hotel, onSelect }) {
  /** Displays hotel summary info as a clickable card. */
  const cover = hotel.photos?.[0];

  return (
    <button
      type="button"
      className="hotel-card"
      onClick={() => onSelect?.(hotel.id)}
      aria-label={`View details for ${hotel.name}`}
    >
      <div className="hotel-card__media">
        {cover ? (
          <img className="hotel-card__img" src={cover} alt={hotel.name} />
        ) : (
          <div className="hotel-card__placeholder">No photo</div>
        )}
      </div>

      <div className="hotel-card__body">
        <div className="hotel-card__top">
          <div className="hotel-card__name">{hotel.name}</div>
          <div className="hotel-card__price">
            <span className="hotel-card__priceValue">${hotel.pricePerNight}</span>
            <span className="hotel-card__priceUnit">/night</span>
          </div>
        </div>

        <div className="hotel-card__meta">
          <span className="hotel-card__location">{hotel.location}</span>
          <span className="hotel-card__dot" aria-hidden="true">
            •
          </span>
          <span className="hotel-card__rating">
            {hotel.rating} ({hotel.reviewCount})
          </span>
        </div>

        {Array.isArray(hotel.amenities) && hotel.amenities.length > 0 ? (
          <div className="hotel-card__amenities" aria-label="Amenities">
            {hotel.amenities.slice(0, 4).map((a) => (
              <span key={a} className="chip">
                {a}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </button>
  );
}
