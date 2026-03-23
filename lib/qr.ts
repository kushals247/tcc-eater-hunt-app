import QRCode from 'qrcode'

export async function generateQRCodeDataURL(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'H',
    margin: 4,
    width: 400,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  })
}

export async function generateQRCodeBuffer(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, {
    errorCorrectionLevel: 'H',
    margin: 4,
    width: 400,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  })
}

export function generatePosterHTML(params: {
  qrDataUrl: string
  huntTitle: string
  locationName: string
  registrationHeadline: string
  baseUrl: string
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${params.huntTitle} - QR Poster</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Georgia, 'Times New Roman', serif;
      background: #fff;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .poster {
      width: 210mm;
      min-height: 297mm;
      padding: 20mm;
      border: 2px solid #2d5a27;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      position: relative;
    }
    .corner {
      position: absolute;
      width: 20px;
      height: 20px;
      border-color: #e76f51;
      border-style: solid;
    }
    .corner-tl { top: 10mm; left: 10mm; border-width: 3px 0 0 3px; }
    .corner-tr { top: 10mm; right: 10mm; border-width: 3px 3px 0 0; }
    .corner-bl { bottom: 10mm; left: 10mm; border-width: 0 0 3px 3px; }
    .corner-br { bottom: 10mm; right: 10mm; border-width: 0 3px 3px 0; }
    .logo-placeholder {
      width: 160px;
      height: 80px;
      background: #e8e8e8;
      border: 2px dashed #999;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
      font-size: 14px;
      font-family: Arial, sans-serif;
      border-radius: 4px;
      margin-bottom: 16px;
    }
    .headline {
      font-size: 22px;
      font-weight: bold;
      color: #2d5a27;
      text-align: center;
      line-height: 1.3;
      margin-bottom: 12px;
    }
    .subtext {
      font-size: 16px;
      color: #666;
      text-align: center;
      margin-bottom: 24px;
      font-style: italic;
    }
    .qr-container {
      padding: 16px;
      border: 3px solid #2d5a27;
      border-radius: 8px;
      background: white;
      margin: 16px 0;
    }
    .qr-container img {
      display: block;
      width: 200px;
      height: 200px;
    }
    .scan-label {
      font-size: 14px;
      color: #e76f51;
      text-align: center;
      margin-top: 12px;
      text-transform: uppercase;
      letter-spacing: 2px;
      font-family: Arial, sans-serif;
    }
    .footer {
      text-align: center;
      color: #999;
      font-size: 12px;
      font-family: Arial, sans-serif;
      border-top: 1px solid #eee;
      padding-top: 12px;
      width: 100%;
    }
    @media print {
      body { margin: 0; background: white; min-height: unset; }
      .poster { border: 2px solid #2d5a27; page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="poster">
    <div class="corner corner-tl"></div>
    <div class="corner corner-tr"></div>
    <div class="corner corner-bl"></div>
    <div class="corner corner-br"></div>

    <div style="display:flex;flex-direction:column;align-items:center;flex:1;justify-content:center;gap:8px;">
      <div class="logo-placeholder">Your Logo Here</div>
      <h1 class="headline">${params.registrationHeadline}</h1>
      <p class="subtext">Scan the QR code to begin!</p>

      <div class="qr-container">
        <img src="${params.qrDataUrl}" alt="QR Code" />
      </div>

      <p class="scan-label">📱 Scan with your phone camera</p>
    </div>

    <div class="footer">
      <strong>${params.huntTitle}</strong> &bull; ${params.locationName}
    </div>
  </div>
</body>
</html>`
}
