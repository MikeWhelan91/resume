// components/pdf/registerFonts.js
import { Font } from "@react-pdf/renderer";

const base = typeof window !== "undefined" ? window.location.origin : "";
const url = (p) => (base ? new URL(p, base).toString() : p);

// default + explicit weights
Font.register({ family: "InterPDF", src: url("/fonts/Inter-Regular.ttf") });
Font.register({ family: "InterPDF", src: url("/fonts/Inter-Regular.ttf"),  fontWeight: 400 });
Font.register({ family: "InterPDF", src: url("/fonts/Inter-Medium.ttf"),   fontWeight: 500 });
Font.register({ family: "InterPDF", src: url("/fonts/Inter-SemiBold.ttf"), fontWeight: 600 });
Font.register({ family: "InterPDF", src: url("/fonts/Inter-Bold.ttf"),     fontWeight: 700 });
