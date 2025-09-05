import { Font } from "@react-pdf/renderer";

// Register a default (400) face so "fontWeight: 400" resolves
Font.register({
  family: "InterPDF",
  src: "/fonts/Inter-Regular.ttf",      // default face
});

// Register other weights explicitly
Font.register({ family: "InterPDF", src: "/fonts/Inter-Medium.ttf",   fontWeight: 500 });
Font.register({ family: "InterPDF", src: "/fonts/Inter-SemiBold.ttf", fontWeight: 600 });
Font.register({ family: "InterPDF", src: "/fonts/Inter-Bold.ttf",     fontWeight: 700 });
