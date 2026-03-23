import nodemailer from 'nodemailer'
import { format } from 'date-fns'

export function isEmailConfigured(): boolean {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.SMTP_FROM
  )
}

function createTransporter() {
  if (!isEmailConfigured()) return null

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

interface VoucherEmailParams {
  to: string
  participantName: string
  voucherCode: string
  discountPercent: number
  expiryDate: Date | null
  huntTitle: string
  locationName: string
}

export async function sendVoucherEmail(params: VoucherEmailParams): Promise<boolean> {
  if (!isEmailConfigured()) return false

  const transporter = createTransporter()
  if (!transporter) return false

  const expiryText = params.expiryDate
    ? `Valid until ${format(params.expiryDate, 'MMMM d, yyyy')}`
    : 'No expiry date'

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Your Voucher Code</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f7f4;">
  <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <h1 style="color: #2d5a27; text-align: center; margin-bottom: 8px;">🎉 Congratulations, ${params.participantName}!</h1>
    <p style="text-align: center; color: #666; margin-bottom: 32px;">You've completed the <strong>${params.huntTitle}</strong> at ${params.locationName}!</p>

    <div style="border: 3px dashed #2d5a27; border-radius: 8px; padding: 24px; text-align: center; background: #f0f7ee; margin-bottom: 24px;">
      <p style="margin: 0 0 8px; text-transform: uppercase; letter-spacing: 2px; font-size: 12px; color: #666;">YOUR DISCOUNT CODE</p>
      <p style="font-family: monospace; font-size: 28px; font-weight: bold; color: #2d5a27; margin: 0 0 8px; letter-spacing: 2px;">${params.voucherCode}</p>
      <p style="margin: 0; color: #e76f51; font-weight: bold;">${params.discountPercent}% off your next purchase</p>
      <p style="margin: 8px 0 0; color: #999; font-size: 14px;">${expiryText}</p>
    </div>

    <p style="text-align: center; color: #999; font-size: 14px;">Present this code at the till to redeem your discount. Happy shopping! 🛍️</p>
  </div>
</body>
</html>
  `

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: params.to,
      subject: `Your ${params.discountPercent}% Discount Voucher - ${params.huntTitle}`,
      html,
    })
    return true
  } catch (error) {
    console.error('Failed to send voucher email:', error)
    return false
  }
}
