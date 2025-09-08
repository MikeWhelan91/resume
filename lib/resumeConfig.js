import Classic from "../components/templates/Classic";
import TwoCol from "../components/templates/TwoCol";
import Centered from "../components/templates/Centered";
import Sidebar from "../components/templates/Sidebar";
import Modern from "../components/templates/Modern";

export const templateMap = {
  classic: Classic,
  twocol: TwoCol,
  centered: Centered,
  sidebar: Sidebar,
  modern: Modern,
};

export function getTemplate(template) {
  return templateMap[String(template).toLowerCase()] || Classic;
}

export const densityMap = {
  compact: { fontSize: "11px", lineHeight: "1.5" },
  normal: { fontSize: "12.5px", lineHeight: "1.75" },
  cozy: { fontSize: "14px", lineHeight: "1.9" },
};
