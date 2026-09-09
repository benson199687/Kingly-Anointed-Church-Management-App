import { jsPDF } from "jspdf";

export interface CertificateTheme {
  primary: [number, number, number];
  border: [number, number, number];
  nameText: [number, number, number];
}

export const CERTIFICATE_THEMES: Record<string, CertificateTheme> = {
  gold: {
    primary: [180, 134, 40],
    border: [218, 165, 32],
    nameText: [49, 46, 129]
  },
  blue: {
    primary: [29, 78, 216],
    border: [59, 130, 246],
    nameText: [30, 41, 59]
  },
  burgundy: {
    primary: [153, 27, 27],
    border: [220, 38, 38],
    nameText: [127, 29, 29]
  },
  emerald: {
    primary: [6, 95, 70],
    border: [16, 185, 129],
    nameText: [6, 78, 59]
  },
  purple: {
    primary: [109, 40, 217],
    border: [139, 92, 246],
    nameText: [88, 28, 135]
  }
};

export function generateCertificatePdf({
  studentName,
  courseTitle,
  signatory1,
  signatory1Title,
  signatory2,
  signatory2Title,
  dateStr,
  themeName = "gold"
}: {
  studentName: string;
  courseTitle: string;
  signatory1: string;
  signatory1Title: string;
  signatory2: string;
  signatory2Title: string;
  dateStr: string;
  themeName?: string;
}) {
  const theme = CERTIFICATE_THEMES[themeName] || CERTIFICATE_THEMES.gold;

  // Create landscape PDF (A4 is 297mm x 210mm)
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4"
  });

  // Background and borders
  // Draw premium theme borders
  doc.setDrawColor(theme.border[0], theme.border[1], theme.border[2]);
  doc.setLineWidth(1.5);
  doc.rect(10, 10, 277, 190); // Outer border
  
  doc.setLineWidth(0.5);
  doc.rect(12, 12, 273, 186); // Inner border

  // Corner decorations (Theme Border color)
  doc.setDrawColor(theme.border[0], theme.border[1], theme.border[2]);
  doc.setLineWidth(1);
  // Top-left corner lines
  doc.line(15, 15, 25, 15);
  doc.line(15, 15, 15, 25);
  // Top-right corner lines
  doc.line(282, 15, 272, 15);
  doc.line(282, 15, 282, 25);
  // Bottom-left corner lines
  doc.line(15, 195, 25, 195);
  doc.line(15, 195, 15, 185);
  // Bottom-right corner lines
  doc.line(282, 195, 272, 195);
  doc.line(282, 195, 282, 185);

  // Institution Title
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(22);
  doc.text("CHURCH KINGLY ANOINTED APP", 148.5, 35, { align: "center" });

  // Subtitle
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(11);
  doc.text("SCRIPTURE ACADEMY GRADUATE", 148.5, 43, { align: "center" });

  // Divider Line
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.setLineWidth(0.5);
  doc.line(80, 50, 217, 50);

  // Certificate Heading
  doc.setTextColor(theme.primary[0], theme.primary[1], theme.primary[2]);
  doc.setFont("Times", "italic");
  doc.setFontSize(26);
  doc.text("Certificate of Completion", 148.5, 68, { align: "center" });

  // Awarded to
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10);
  doc.text("This is proudly awarded to", 148.5, 82, { align: "center" });

  // Student Name
  doc.setTextColor(theme.nameText[0], theme.nameText[1], theme.nameText[2]);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(24);
  doc.text(studentName.toUpperCase(), 148.5, 96, { align: "center" });

  // Underline under Student Name
  doc.setDrawColor(theme.border[0], theme.border[1], theme.border[2]);
  doc.setLineWidth(1);
  doc.line(70, 102, 227, 102);

  // Description
  doc.setTextColor(71, 85, 105); // Slate-600
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(11);
  const descText = `for successfully completing the deep discipleship curriculum of\n${courseTitle}\nwith distinction, honor, and theological accountability.`;
  doc.text(descText, 148.5, 114, { align: "center", lineHeightFactor: 1.4 });

  // Date
  doc.setTextColor(148, 163, 184); // Slate-400
  doc.setFont("Times", "italic");
  doc.setFontSize(11);
  doc.text(`Completed on ${dateStr}`, 148.5, 142, { align: "center" });

  // Signatures Area
  doc.setDrawColor(203, 213, 225); // Slate-300
  doc.setLineWidth(0.5);
  
  // Signatory 1 Line
  doc.line(45, 172, 115, 172);
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.text(signatory1, 80, 178, { align: "center" });
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(signatory1Title, 80, 183, { align: "center" });

  // Signatory 2 Line
  doc.line(182, 172, 252, 172);
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.text(signatory2, 217, 178, { align: "center" });
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(signatory2Title, 217, 183, { align: "center" });

  // Save the PDF
  doc.save(`Certificate_${studentName.replace(/\s+/g, "_")}_${courseTitle.replace(/\s+/g, "_")}.pdf`);
}
