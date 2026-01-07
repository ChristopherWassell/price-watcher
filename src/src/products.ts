export interface Product {
  name: string;
  url: string;
  selector: string;
  targetPrice?: number; /// ? means optional, can removed be undefined if no alert needed
}

export const products: Product[] = [
  {
    name: "LG Ultragear OLED Gaming Monitor 27GS93QE, 27 Inch, 1440p, 240Hz, 0.03ms, OLED Display, G-Sync Compatible, HDR10, HDMI, DisplayPort, USB-C",
    url: "https://www.amazon.co.uk/dp/B0D8JWPPDK/?coliid=I1NRL41DWDI7Z5&colid=2OVSHFWOYJSDZ&ref_=list_c_wl_lv_ov_lig_dp_it&th=1",
    selector: ".a-price-whole",
    targetPrice: 150
  },
//   {
//     name: "Persian Rug",
//     url: "https://www.example.com/rug",
//     selector: ".price",
//     targetPrice: 50
//   },
//   {
//     name: "Small Country Figurine",
//     url: "https://www.example.com/figurine",
//     selector: ".price",
//     targetPrice: 10
//   }
// ];
]
