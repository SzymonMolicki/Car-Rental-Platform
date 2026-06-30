export const featuredCars = [
  { id: "CT-101", brand: "Toyota", model: "Corolla", year: 2024, rate: 149, status: "Available" },
  { id: "CT-204", brand: "Skoda", model: "Octavia", year: 2023, rate: 179, status: "Available" },
  { id: "CT-309", brand: "BMW", model: "X1", year: 2025, rate: 299, status: "Popular" },
];

export const sampleRentalHistory = [
  { id: "RN-001", car: "Toyota Corolla", dates: "2026-05-09 → 2026-05-14", status: "Completed", total: "745 zł" },
  { id: "RN-002", car: "Skoda Octavia", dates: "2026-05-28 → 2026-06-02", status: "Completed", total: "895 zł" },
  { id: "RN-003", car: "BMW X1", dates: "2026-06-22 → 2026-06-25", status: "Reserved", total: "897 zł" },
];

export const samplePayments = [
  { id: "PM-001", date: "2026-05-14", amount: "745 zł", method: "Card", status: "Paid" },
  { id: "PM-002", date: "2026-06-02", amount: "895 zł", method: "Card", status: "Paid" },
  { id: "PM-003", date: "2026-06-22", amount: "897 zł", method: "Apple Pay", status: "Pending" },
];