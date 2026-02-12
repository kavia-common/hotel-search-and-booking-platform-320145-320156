import React from "react";

// PUBLIC_INTERFACE
export function Navbar({ title, children }) {
  /** Top navigation bar layout wrapper. */
  return (
    <div className="navbar">
      <div className="navbar__inner">
        <div className="navbar__brand" aria-label="App brand">
          <div className="navbar__logo" aria-hidden="true">
            H
          </div>
          <div className="navbar__title">{title}</div>
        </div>
        <div className="navbar__content">{children}</div>
      </div>
    </div>
  );
}
