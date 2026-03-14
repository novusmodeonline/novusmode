export const MOCK_ADDRESSES = [
  {
    line1: "H-12, Green Park, Block A",
    city: "New Delhi",
    state: "Delhi",
    stateCode: "07",
    pincode: "110016",
  },
  {
    line1: "Flat 503, Lajpat Nagar Phase II",
    city: "New Delhi",
    state: "Delhi",
    stateCode: "07",
    pincode: "110024",
  },
  {
    line1: "Plot 21, Sector 62",
    city: "Noida",
    state: "Uttar Pradesh",
    stateCode: "09",
    pincode: "201309",
  },
  {
    line1: "H-88, Gomti Nagar Extension",
    city: "Lucknow",
    state: "Uttar Pradesh",
    stateCode: "09",
    pincode: "226010",
  },
  {
    line1: "Flat 302, Andheri East",
    city: "Mumbai",
    state: "Maharashtra",
    stateCode: "27",
    pincode: "400069",
  },
  {
    line1: "C-404, Powai Lake View",
    city: "Mumbai",
    state: "Maharashtra",
    stateCode: "27",
    pincode: "400076",
  },
  {
    line1: "Row House 9, Baner Road",
    city: "Pune",
    state: "Maharashtra",
    stateCode: "27",
    pincode: "411045",
  },
  {
    line1: "Flat 12B, Viman Nagar",
    city: "Pune",
    state: "Maharashtra",
    stateCode: "27",
    pincode: "411014",
  },
  {
    line1: "No. 45, Whitefield Main Road",
    city: "Bengaluru",
    state: "Karnataka",
    stateCode: "29",
    pincode: "560066",
  },
  {
    line1: "Flat 701, BTM Layout 2nd Stage",
    city: "Bengaluru",
    state: "Karnataka",
    stateCode: "29",
    pincode: "560076",
  },

  // ---- repeat pattern safely across states ----

  {
    line1: "Plot 16, Anna Nagar West",
    city: "Chennai",
    state: "Tamil Nadu",
    stateCode: "33",
    pincode: "600040",
  },
  {
    line1: "Flat 209, Velachery Main Road",
    city: "Chennai",
    state: "Tamil Nadu",
    stateCode: "33",
    pincode: "600042",
  },
  {
    line1: "House No 88, Salt Lake Sector V",
    city: "Kolkata",
    state: "West Bengal",
    stateCode: "19",
    pincode: "700091",
  },
  {
    line1: "Flat 5A, Ballygunge Place",
    city: "Kolkata",
    state: "West Bengal",
    stateCode: "19",
    pincode: "700019",
  },
  {
    line1: "Villa 17, Banjara Hills Road No 12",
    city: "Hyderabad",
    state: "Telangana",
    stateCode: "36",
    pincode: "500034",
  },
  {
    line1: "Flat 404, Gachibowli",
    city: "Hyderabad",
    state: "Telangana",
    stateCode: "36",
    pincode: "500032",
  },
  {
    line1: "House 21, Sector 15",
    city: "Chandigarh",
    state: "Chandigarh",
    stateCode: "04",
    pincode: "160015",
  },
  {
    line1: "Flat 601, HSR Layout Sector 2",
    city: "Bengaluru",
    state: "Karnataka",
    stateCode: "29",
    pincode: "560102",
  },
  {
    line1: "Plot 33, Rajarhat New Town",
    city: "Kolkata",
    state: "West Bengal",
    stateCode: "19",
    pincode: "700135",
  },
  {
    line1: "Flat 402, Indiranagar 100 Ft Road",
    city: "Bengaluru",
    state: "Karnataka",
    stateCode: "29",
    pincode: "560038",
  },

  // 👉 Continue this same structure
  // You can safely scale to 100+ by duplicating pattern
];

export function getRandomMockAddress() {
  const address =
    MOCK_ADDRESSES[Math.floor(Math.random() * MOCK_ADDRESSES.length)];
  return {
    address: `${address.line1}, ${address.city} ${address.pincode}, ${address.state}, India`,
    stateCode: address.stateCode,
  };
}
