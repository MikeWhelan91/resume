import { Font } from "@react-pdf/renderer";

// Register each Inter weight as its own family to avoid resolution issues
Font.register({ family: "InterRegular", src: "/public/fonts/Inter-Regular.ttf" });
Font.register({ family: "InterMedium",  src: "/public/fonts/Inter-Medium.ttf" });
Font.register({ family: "InterSemiBold", src: "/public/fonts/Inter-SemiBold.ttf" });
Font.register({ family: "InterBold",    src: "/public/fonts/Inter-Bold.ttf" });

if (typeof window !== "undefined") {
  // Debug breadcrumb in DevTools
  console.log("[pdf] Inter font variants registered");
}
