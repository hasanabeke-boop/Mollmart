export type OrderStatus = "delivered" | "shipped" | "processing" | "cancelled";

export type Order = {
  id: string;
  shortId: string;
  productName: string;
  date: string;
  status: OrderStatus;
  total: number;
  thumbnail: string;
  trackingNumber: string;
  carrier: string;
  arrivedBy: string;
};

export const ORDERS: Order[] = [
  {
    id: "245-9812",
    shortId: "#245-9812",
    productName: "Smart Watch Series 7",
    date: "2023-10-24",
    status: "delivered",
    total: 124.5,
    thumbnail:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAMxALZ3Z1AMzJshHY7Np7zLBwVCx0yr6M5ufbjMV5tQIPCiXnQyFGPwQb6iQ8Eg4Sv7eHMnJK4yI6Lz8JwbO3eiQmH-wg775VbYKfUO2ij6emMKDRuOcQwrbrFSYp9KpPSAALlwIdM9qaryZUAYVZ8HoNkMt5D0zAbv8qk19QaiKh4yMlqxuXJn3Zj3lzHU3d-mx8nVeV5vKD7Fm5pXAH0PsO772NFLsS-ISNqKq5e0YG8Jkefz_kkL7hxFVJwab98I_V6t4VlLY8",
    trackingNumber: "9200190123",
    carrier: "DHL Express",
    arrivedBy: "Tuesday, Oct 24",
  },
  {
    id: "245-8841",
    shortId: "#245-8841",
    productName: "Wireless Headphones",
    date: "2023-10-10",
    status: "shipped",
    total: 215,
    thumbnail:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBE1IVlv3fLGJg5QXZEbEK2btAVBw6d0NmHCN-kFQYfAziLDrxeSHG6I3XvC71FzFSpuWGlTooVf0D40u5mJ083G7fJ9QgNUFhIi5Nvgeo6Lb7rIiE2hp3yCj9sl0uetb8Tft6kR2Y0fl9LHR6EU9IXeCtZY6L6mUd95nZwRm8mWcZCeBrt1OHXjmWLOXe4NGfzRdrhS0fw39r3yPJFBk2zomwtjf1xtev1Rp3rdd95-CxeZEeA1vukQcxwh639IMqoNZf50b-SCn4",
    trackingNumber: "9200190456",
    carrier: "DHL Express",
    arrivedBy: "Friday, Oct 20",
  },
  {
    id: "245-7723",
    shortId: "#245-7723",
    productName: "Vintage Camera Lens",
    date: "2023-09-28",
    status: "processing",
    total: 189.99,
    thumbnail:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDSyL7XVEsK3pbg9xhDkZNXNrXn1_pOVMgh5cpRagW2pt1rX93MAzC44rmj66tJBxw5bP3RsICDLkM8zh2euTgI-whbXl78hpENVLuwfqKZycjXjFy5YnBBs0PvgNmpBdWRS_2GiVOrhJPwP_KOiippJ5VHYtzmOkA8-fkwc6To_1fW2FfEzi8cwFv71jeaVW1H4k42Idy47A_LYsWtfXZNpI6LVppktFLMFSTKjvwd99gvICH-EYzElitFhLGU6ih_lV2q3C_W2hU",
    trackingNumber: "9200190789",
    carrier: "UPS",
    arrivedBy: "Monday, Oct 30",
  },
  {
    id: "245-6619",
    shortId: "#245-6619",
    productName: "Ceramic Plant Pot",
    date: "2023-09-15",
    status: "delivered",
    total: 89.99,
    thumbnail:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBVANJbS4Tzm5ZNIp3ckrNqDnsZ8eCCOVX6l7tfKzYwcU3E09xT3SJS9IZBEOFqkppDc0qkVi0VSb_ZnO6n7hCjfpcBqm0NpZnHnhEGNdBv7L5izc4CerAdqssq3rGirzpGFCxRWSYSpBvDnEiP0VCx2Z-ibBOCbllU6s2GHT9kcLpas3X7BzB_De0QKhHdqAr4BhOF5yZUVIK0WTgFsaXVXTBti1T-Br3yG_wdxNS2CarUzQWDArgB5OAS5-nLpxXnqVX8IraZd38",
    trackingNumber: "9200190999",
    carrier: "FedEx",
    arrivedBy: "Wednesday, Sep 20",
  },
  {
    id: "245-5502",
    shortId: "#245-5502",
    productName: "Sport Runners Red",
    date: "2023-08-30",
    status: "cancelled",
    total: 45,
    thumbnail:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAZrTWEeUQub5158FgJvdiW45HDRDfNRWb0wM7zlBl9SUZBX-AQ-vHuqnW7KuD3MdNl_k_85Rv7yCLU-TqS7XB7WZqMYLKgP5viGWIr7KCrV3VnWqSP5s2Q9iF5AXBRBAMqhsPtWfWvDEMqYtYDu8XFKbXAtT2KuiU5MO8K3nkDsUlzAd_A2R4bt8tcBXtzvHh4s2sZ_BPe5F5R6QR4Wd2P-wBtrMM_n1yo6BgD4NP56eo5sVjzDOesDQlqUlV9-9TUQjsnNXVixtA",
    trackingNumber: "9200190120",
    carrier: "DHL Express",
    arrivedBy: "N/A",
  },
];

