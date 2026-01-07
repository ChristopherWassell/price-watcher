export interface Product {
  name: string;
  url: string;
  selector: string;
}

export const products: Product[] = [
  {
    name: "Wireless Headphones",
    url: "https://www.amazon.co.uk/dp/B0D8JWPPDK/?coliid=I1NRL41DWDI7Z5&colid=2OVSHFWOYJSDZ&ref_=list_c_wl_lv_ov_lig_dp_it&th=1",
    selector: "a-price-whole"
  },
//   {
//     name: "4K Monitor",
//     url: "https://www.amazon.com/dp/YYYYYYYY",
//     selector: "#corePrice_feature_div span.a-offscreen"
//   }
];
