import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders Hotel Finder navbar", () => {
  render(<App />);
  const title = screen.getByText(/Hotel Finder/i);
  expect(title).toBeInTheDocument();
});
