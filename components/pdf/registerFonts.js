// components/pdf/registerFonts.js
import { Font } from "@react-pdf/renderer";

// Register each Inter weight as its own family to avoid resolution issues
Font.register({
  family: "InterRegular",
  src: "/fonts/Inter-Regular.ttf",
  fontWeight: 400,
});
Font.register({
  family: "InterRegular",
  src: "/fonts/Inter-Italic.woff2",
  fontWeight: 400,
  fontStyle: "italic",
});
Font.register({ family: "InterMedium", src: "/fonts/Inter-Medium.ttf", fontWeight: 500 });
Font.register({ family: "InterSemiBold", src: "/fonts/Inter-SemiBold.ttf", fontWeight: 600 });
Font.register({ family: "InterBold", src: "/fonts/Inter-Bold.ttf", fontWeight: 700 });

if (typeof window !== "undefined") {
  // Debug breadcrumb in DevTools
  console.log("[pdf] Inter font variants registered");
}
