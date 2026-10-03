import { DocumentFilter, SampleDocumentPreset } from '../types';

/**
 * Creates a clean raster PNG Data URL using HTML5 Canvas
 */
function createDocCanvasPng(
  type: 'id_front' | 'id_back' | 'receipt' | 'invoice' | 'certificate' | 'medical' | 'note',
  title: string,
  details: Record<string, string>
): string {
  if (typeof document === 'undefined') {
    return '';
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  if (type === 'id_front') {
    canvas.width = 856;
    canvas.height = 540;

    // Card background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 856, 540);

    // Border
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, 848, 532);

    // Top Blue Header Bar
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(4, 4, 848, 80);

    // Header Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillText('REPUBLIC NATIONAL IDENTITY CARD', 36, 54);

    // Avatar Box
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(50, 130, 200, 250);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.strokeRect(50, 130, 200, 250);

    // Avatar Silhouette
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(150, 210, 45, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(150, 340, 75, Math.PI, 0);
    ctx.fill();

    // Fields
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('CARD NUMBER / ID', 290, 160);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 28px monospace';
    ctx.fillText(details.idNo || 'ID-8841-9920-K', 290, 195);

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText('FULL NAME', 290, 250);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText(details.name || 'ALEXANDER M. REID', 290, 285);

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText('DATE OF BIRTH & EXPIRY', 290, 340);

    ctx.fillStyle = '#334155';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText(`DOB: ${details.dob || '14 AUG 1992'}  •  EXP: ${details.exp || '14 AUG 2032'}`, 290, 375);

    // Gold Chip
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(690, 130, 110, 85);
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 3;
    ctx.strokeRect(690, 130, 110, 85);

    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('SECURE CHIP', 685, 480);
  } else if (type === 'id_back') {
    canvas.width = 856;
    canvas.height = 540;

    // Background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 856, 540);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, 848, 532);

    // Magnetic Strip
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 50, 856, 80);

    // Residential Address
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText('RESIDENTIAL ADDRESS', 40, 185);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText(details.address || '742 Evergreen Terrace, Springfield, OR 97477', 40, 218);

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText('EMERGENCY CONTACT', 40, 275);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText('+1 (555) 019-2834', 40, 308);

    // MRZ Zone Box
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(30, 380, 796, 120);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 380, 796, 120);

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('IDUSA88419920K2<<<<<<<<<<<<<<<', 50, 430);
    ctx.fillText('9208144M3208145USA<<<<<<<<<<<<8', 50, 475);
  } else if (type === 'invoice') {
    canvas.width = 650;
    canvas.height = 800;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 650, 800);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 646, 796);

    // Header Box
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(30, 30, 590, 80);
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 28px system-ui, sans-serif';
    ctx.fillText('TAX INVOICE', 50, 80);

    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(details.invNo || '#INV-2024-889', 450, 80);

    // Billed To
    ctx.fillStyle = '#64748b';
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillText('BILLED TO:', 50, 160);
    ctx.fillText(`DATE: ${details.date || 'Oct 2, 2024'}`, 420, 160);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText(details.client || 'Acme Tech Solutions LLC', 50, 190);

    // Divider
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 230);
    ctx.lineTo(610, 230);
    ctx.stroke();

    // Table Header
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(40, 250, 570, 40);
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText('ITEM DESCRIPTION', 60, 276);
    ctx.fillText('QTY', 390, 276);
    ctx.fillText('AMOUNT', 510, 276);

    // Row 1
    ctx.fillStyle = '#1e293b';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('Cloud Hosting & SLA Services', 60, 330);
    ctx.fillText('1', 400, 330);
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText('$249.00', 510, 330);

    // Row 2
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('SSL Security Certificate (1 Yr)', 60, 390);
    ctx.fillText('1', 400, 390);
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText('$79.00', 510, 390);

    // Row 3
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('Domain DNS Management Setup', 60, 450);
    ctx.fillText('2', 400, 450);
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText('$90.00', 510, 450);

    // Total Box
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(360, 540, 250, 110);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('TOTAL DUE (USD)', 380, 580);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 32px system-ui, sans-serif';
    ctx.fillText(details.total || '$418.00', 380, 625);

    // Paid Stamp
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 4;
    ctx.strokeRect(60, 680, 180, 55);
    ctx.fillStyle = '#16a34a';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('PAID IN FULL', 80, 716);
  } else if (type === 'receipt') {
    canvas.width = 450;
    canvas.height = 680;

    // Paper background
    ctx.fillStyle = '#fffdf0';
    ctx.fillRect(0, 0, 450, 680);
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, 446, 676);

    ctx.fillStyle = '#1c1917';
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('METRO SUPERMARKET', 225, 55);

    ctx.font = '14px monospace';
    ctx.fillStyle = '#78716c';
    ctx.fillText('Store #0482 - Terminal 03', 225, 85);
    ctx.fillText(`Date: ${details.date || '10/02/2024 18:42'}`, 225, 110);

    ctx.textAlign = 'left';
    ctx.strokeStyle = '#a8a29e';
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(30, 135);
    ctx.lineTo(420, 135);
    ctx.stroke();
    ctx.setLineDash([]);

    // Items
    ctx.fillStyle = '#292524';
    ctx.font = '15px monospace';
    ctx.fillText('1x ORGANIC MILK 1L', 40, 175);
    ctx.fillText('$3.80', 360, 175);

    ctx.fillText('2x FRESH AVOCADO', 40, 215);
    ctx.fillText('$4.50', 360, 215);

    ctx.fillText('1x WHOLEGRAIN BREAD', 40, 255);
    ctx.fillText('$2.95', 360, 255);

    ctx.fillText('1x ROASTED COFFEE 250G', 40, 295);
    ctx.fillText('$11.20', 360, 295);

    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(30, 335);
    ctx.lineTo(420, 335);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#1c1917';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('SUBTOTAL', 40, 375);
    ctx.fillText('$22.45', 350, 375);

    ctx.fillStyle = '#047857';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('TOTAL PAID', 40, 435);
    ctx.fillText(details.total || '$24.25', 335, 435);

    ctx.fillStyle = '#78716c';
    ctx.font = '13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAYMENT: VISA **** 4492', 225, 520);
    ctx.fillText('AUTH CODE: 981240', 225, 545);

    // Barcode
    ctx.fillStyle = '#1c1917';
    for (let i = 80; i < 370; i += 12) {
      ctx.fillRect(i, 580, (i % 5) + 2, 45);
    }
  } else if (type === 'certificate') {
    canvas.width = 800;
    canvas.height = 560;

    // Background
    ctx.fillStyle = '#fffdfa';
    ctx.fillRect(0, 0, 800, 560);
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, 790, 550);

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, 760, 520);

    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 34px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('CERTIFICATE OF ACHIEVEMENT', 400, 90);

    ctx.fillStyle = '#92400e';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('THIS IS PROUDLY PRESENTED TO', 400, 135);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 40px Georgia, serif';
    ctx.fillText(details.recipient || 'SARAH J. CONNOR', 400, 210);

    ctx.fillStyle = '#475569';
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText('For outstanding completion and excellence in', 400, 280);

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText(details.course || 'Advanced Software Architecture & AI Systems', 400, 320);

    ctx.fillStyle = '#64748b';
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillText(`Date Awarded: ${details.date || 'October 2024'}  •  Ref: CERT-88301-A`, 400, 375);

    // Gold Ribbon Seal
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(400, 460, 42, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('HONORS', 400, 465);
  } else if (type === 'medical') {
    canvas.width = 600;
    canvas.height = 750;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 600, 750);
    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 596, 746);

    ctx.fillStyle = '#2563eb';
    ctx.fillRect(0, 0, 600, 85);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText('CITY HEALTHCARE CLINIC', 35, 50);

    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText('Department of Diagnostic Medicine • Dr. H. Watson, MD', 35, 72);

    ctx.fillStyle = '#64748b';
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillText('PATIENT NAME:', 35, 140);
    ctx.fillText('DATE OF VISIT:', 35, 180);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText(details.patient || 'Robert Chen (Age 34)', 180, 140);
    ctx.fillText(details.date || '10/01/2024', 180, 180);

    // Rx Section
    ctx.fillStyle = '#1e40af';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('Rx PRESCRIPTION', 35, 250);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 17px system-ui, sans-serif';
    ctx.fillText('1. Amoxicillin 500mg Capsules', 35, 295);

    ctx.fillStyle = '#475569';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText('Take 1 capsule orally three times daily for 7 days with meals.', 55, 325);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 17px system-ui, sans-serif';
    ctx.fillText('2. Cetirizine 10mg Tablets', 35, 375);

    ctx.fillStyle = '#475569';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText('Take 1 tablet at bedtime as needed for seasonal allergies.', 55, 405);

    // Notes Box
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(35, 460, 530, 120);
    ctx.strokeStyle = '#e2e8f0';
    ctx.strokeRect(35, 460, 530, 120);

    ctx.fillStyle = '#334155';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText("Doctor's Clinical Notes:", 50, 490);

    ctx.fillStyle = '#475569';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText('Patient presented with mild respiratory symptoms. Vitals stable.', 50, 520);
    ctx.fillText('Follow-up in 10 days if symptoms persist.', 50, 545);

    ctx.fillStyle = '#1e40af';
    ctx.font = 'italic 24px Georgia, serif';
    ctx.fillText('Dr. H. Watson, MD', 400, 680);
  } else {
    // Note
    canvas.width = 500;
    canvas.height = 650;

    ctx.fillStyle = '#fffef0';
    ctx.fillRect(0, 0, 500, 650);
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 496, 646);

    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 0);
    ctx.lineTo(40, 650);
    ctx.stroke();

    ctx.fillStyle = '#334155';
    ctx.font = 'bold 22px Georgia, serif';
    ctx.fillText(title, 60, 60);

    ctx.fillStyle = '#475569';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('• Confirm appointment with notary office', 60, 120);
    ctx.fillText('• Bring 2 government-issued photo IDs', 60, 170);
    ctx.fillText('• Print 4 copies of signed lease agreement', 60, 220);
    ctx.fillText('• Check payment receipt reference #9821', 60, 270);
  }

  return canvas.toDataURL('image/png');
}

export function getSamplePresets(): SampleDocumentPreset[] {
  return [
    {
      id: 'id_duo_pack',
      title: 'ID Card (Front & Back Duo)',
      description: 'Perfect 2-card driver license / national ID front and back centered on A4 with cutline',
      badge: '2 Images • ID Mode',
      layout: 'id_duo',
      headerTitle: 'GOVERNMENT PHOTO IDENTITY VERIFICATION',
      headerSubtitle: 'Official Identification Copy for Verification & Records',
      items: [
        {
          name: 'National ID Card - Front.png',
          sampleSvgOrUrl: createDocCanvasPng('id_front', 'National ID Front', {
            idNo: 'ID-8841-9920-K',
            name: 'ALEXANDER M. REID',
            dob: '14 AUG 1992',
            exp: '14 AUG 2032',
          }),
          documentType: 'ID Card Front',
          ocrText: 'REPUBLIC NATIONAL IDENTITY CARD\nCard No: ID-8841-9920-K\nName: ALEXANDER M. REID\nDOB: 14 AUG 1992\nEXP: 14 AUG 2032\nSECURE HOLOGRAM CHIP VERIFIED',
          filter: 'magic_color',
          keyFields: [
            { label: 'ID Number', value: 'ID-8841-9920-K' },
            { label: 'Full Name', value: 'Alexander M. Reid' },
            { label: 'Expiry Date', value: '14 Aug 2032' },
          ],
        },
        {
          name: 'National ID Card - Back.png',
          sampleSvgOrUrl: createDocCanvasPng('id_back', 'National ID Back', {
            address: '742 Evergreen Terrace, Springfield, OR 97477',
          }),
          documentType: 'ID Card Back',
          ocrText: 'RESIDENTIAL ADDRESS: 742 Evergreen Terrace, Springfield, OR 97477\nEMERGENCY CONTACT: +1 (555) 019-2834\nMRZ: IDUSA88419920K2<<<<<<<<<<<<<<< 9208144M3208145USA<<<<<<<<<<<<8',
          filter: 'magic_color',
          keyFields: [
            { label: 'Address', value: '742 Evergreen Terrace, Springfield, OR' },
            { label: 'Emergency', value: '+1 (555) 019-2834' },
            { label: 'MRZ Valid', value: 'Yes (Checksum Verified)' },
          ],
        },
      ],
    },
    {
      id: 'quad_bills_pack',
      title: '4 Expense Receipts & Invoices',
      description: '4 business receipts and invoices neatly organized in a 2x2 grid on a single A4 page',
      badge: '4 Images • 2x2 Grid',
      layout: 'grid_2x2',
      headerTitle: 'MONTHLY EXPENSE REIMBURSEMENT REPORT',
      headerSubtitle: 'Submitted by Financial Department • Total 4 Invoices Attached',
      items: [
        {
          name: 'Tax_Invoice_Cloud_Hosting.png',
          sampleSvgOrUrl: createDocCanvasPng('invoice', 'Tax Invoice #INV-2024-889', {
            invNo: '#INV-2024-889',
            client: 'Acme Tech Solutions LLC',
            date: 'Oct 2, 2024',
            total: '$418.00',
          }),
          documentType: 'Tax Invoice',
          ocrText: 'TAX INVOICE #INV-2024-889\nBilled to: Acme Tech Solutions LLC\nCloud Hosting SLA: $249.00\nSSL Certificate: $79.00\nDNS Management: $90.00\nTOTAL DUE: $418.00 (PAID IN FULL)',
          filter: 'bw_clean',
          keyFields: [
            { label: 'Invoice #', value: 'INV-2024-889' },
            { label: 'Total Amount', value: '$418.00' },
            { label: 'Status', value: 'PAID IN FULL' },
          ],
        },
        {
          name: 'Supermarket_Receipt.png',
          sampleSvgOrUrl: createDocCanvasPng('receipt', 'Metro Supermarket', {
            date: '10/02/2024 18:42',
            total: '$24.25',
          }),
          documentType: 'Store Receipt',
          ocrText: 'METRO SUPERMARKET #0482\nMilk: $3.80\nAvocado: $4.50\nBread: $2.95\nCoffee: $11.20\nSubtotal: $22.45\nTax: $1.80\nTOTAL: $24.25 (VISA ****4492)',
          filter: 'high_contrast',
          keyFields: [
            { label: 'Vendor', value: 'Metro Supermarket' },
            { label: 'Total Paid', value: '$24.25' },
            { label: 'Payment', value: 'VISA ****4492' },
          ],
        },
        {
          name: 'Medical_Prescription.png',
          sampleSvgOrUrl: createDocCanvasPng('medical', 'City Healthcare Clinic', {
            patient: 'Robert Chen (Age 34)',
            date: '10/01/2024',
          }),
          documentType: 'Medical Prescription',
          ocrText: 'CITY HEALTHCARE CLINIC\nPatient: Robert Chen (Age 34)\nRx 1: Amoxicillin 500mg (1 tid x 7d)\nRx 2: Cetirizine 10mg (1 hs prn)\nDoctor: Dr. H. Watson, MD',
          filter: 'magic_color',
          keyFields: [
            { label: 'Clinic', value: 'City Healthcare Clinic' },
            { label: 'Patient', value: 'Robert Chen' },
            { label: 'Doctor', value: 'Dr. H. Watson, MD' },
          ],
        },
        {
          name: 'Important_Action_Items.png',
          sampleSvgOrUrl: createDocCanvasPng('note', 'Document Verification Checklist', {}),
          documentType: 'Handwritten Checklist',
          ocrText: 'DOCUMENT CHECKLIST\n1. Confirm appointment with notary office\n2. Bring 2 government-issued photo IDs\n3. Print 4 copies of signed lease agreement\n4. Check payment receipt reference #9821',
          filter: 'bw_clean',
          keyFields: [
            { label: 'Type', value: 'Action Checklist' },
            { label: 'Items', value: '4 Checklist Tasks' },
            { label: 'Status', value: 'Ready for filing' },
          ],
        },
      ],
    },
    {
      id: 'tri_certificates_pack',
      title: '3 Academic Certificates & Diplomas',
      description: '3 professional certificates formatted with top hero layout on A4 paper',
      badge: '3 Images • Hero Layout',
      layout: 'hero_top_2_bottom',
      headerTitle: 'ACADEMIC & PROFESSIONAL CREDENTIALS PORTFOLIO',
      headerSubtitle: 'Certified Copies Submitted for Credential Evaluation',
      items: [
        {
          name: 'Master_Degree_Certificate.png',
          sampleSvgOrUrl: createDocCanvasPng('certificate', 'Certificate of Achievement', {
            recipient: 'SARAH J. CONNOR',
            course: 'Master of Science in Software Systems',
            date: 'June 2024',
          }),
          documentType: 'Academic Degree',
          ocrText: 'CERTIFICATE OF ACHIEVEMENT\nPresented to: SARAH J. CONNOR\nMaster of Science in Software Systems\nHonors Awarded: Magna Cum Laude\nDate: June 2024',
          filter: 'sharp_photo',
          keyFields: [
            { label: 'Recipient', value: 'Sarah J. Connor' },
            { label: 'Degree', value: 'M.S. Software Systems' },
            { label: 'Honors', value: 'Magna Cum Laude' },
          ],
        },
        {
          name: 'Cloud_Architect_Certification.png',
          sampleSvgOrUrl: createDocCanvasPng('certificate', 'Cloud Architect Credential', {
            recipient: 'SARAH J. CONNOR',
            course: 'Professional Cloud Solutions Architect',
            date: 'August 2024',
          }),
          documentType: 'Professional License',
          ocrText: 'CLOUD ARCHITECT CERTIFICATION\nCandidate: SARAH J. CONNOR\nCredential ID: CLD-2024-9912\nValid Thru: August 2027',
          filter: 'magic_color',
          keyFields: [
            { label: 'Credential', value: 'Cloud Solutions Architect' },
            { label: 'ID', value: 'CLD-2024-9912' },
          ],
        },
        {
          name: 'AI_Safety_Certification.png',
          sampleSvgOrUrl: createDocCanvasPng('certificate', 'AI Ethics & Safety', {
            recipient: 'SARAH J. CONNOR',
            course: 'Advanced AI Alignment & Security',
            date: 'September 2024',
          }),
          documentType: 'Security Certificate',
          ocrText: 'CERTIFICATE IN AI SAFETY & ETHICS\nPresented to SARAH J. CONNOR\nCompleted 80 Hours of Practical Evaluation\nRef: ETHICS-4412',
          filter: 'bw_clean',
          keyFields: [
            { label: 'Course', value: 'AI Alignment & Security' },
            { label: 'Hours', value: '80 Hours Certified' },
          ],
        },
      ],
    },
  ];
}

export const SAMPLE_PRESETS: SampleDocumentPreset[] = getSamplePresets();
