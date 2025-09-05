import { Font } from "@react-pdf/renderer";

// Register each Inter weight as its own family to avoid resolution issues
Font.register({ family: "InterRegular", src: "/fonts/Inter-Regular.ttf" });
Font.register({ family: "InterMedium",  src: "/fonts/Inter-Medium.ttf" });
Font.register({ family: "InterSemiBold", src: "/fonts/Inter-SemiBold.ttf" });
Font.register({ family: "InterBold",    src: "/fonts/Inter-Bold.ttf" });

if (typeof window !== "undefined") {
  // Debug breadcrumb in DevTools
  console.log("[pdf] Inter font variants registered");
}
