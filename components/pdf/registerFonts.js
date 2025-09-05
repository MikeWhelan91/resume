import { Font } from "@react-pdf/renderer";

// Default face (weight 400) so fontWeight:400 resolves
Font.register({ family: "InterPDF", src: "/fonts/Inter-Regular.ttf", fontWeight: 400 });

// Additional weights
Font.register({ family: "InterPDF", src: "/fonts/Inter-Medium.ttf",   fontWeight: 500 });
Font.register({ family: "InterPDF", src: "/fonts/Inter-SemiBold.ttf", fontWeight: 600 });
Font.register({ family: "InterPDF", src: "/fonts/Inter-Bold.ttf",     fontWeight: 700 });

if (typeof window !== "undefined") {
  // Debug breadcrumb in DevTools
  console.log("[pdf] InterPDF fonts registered");
}
