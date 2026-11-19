/**
 * Zero-dependency Amazon SES v2 HTTPS sender using AWS Signature Version 4
 * and HMAC-SHA256 representative unsubscribe token signing.
 */

import * as crypto from "crypto";
import * as https from "https";

export interface SesCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

export interface SendRepNotificationParams {
  credentials: SesCredentials;
  fromEmail: string;
  toEmail: string;
  repName: string;
  electedOffice: string;
  districtName: string;
  constituentName: string;
  constituentPostcode: string;
  subjectLine: string;
  visibility: "public" | "private";
  unreadCount: number;
  unsubscribeUrl: string;
  registerUrl: string;
}

function sha256Hex(data: string): string {
  return crypto.createHash("sha256").update(data, "utf8").digest("hex");
}

function hmacSha256(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac("sha256", key).update(data, "utf8").digest();
}

/**
 * Create an HMAC-SHA256 hex signature for a representative unsubscribe link.
 */
export function createUnsubscribeSignature(
  secret: string,
  repId: string,
  email: string,
): string {
  const payload = `${repId.trim().toLowerCase()}:${email.trim().toLowerCase()}`;
  return crypto
    .createHmac("sha256", secret)
    .update(payload, "utf8")
    .digest("hex");
}

/**
 * Constant-time verification of a representative unsubscribe HMAC signature.
 */
export function verifyUnsubscribeSignature(
  secret: string,
  repId: string,
  email: string,
  signature: string,
): boolean {
  const expected = createUnsubscribeSignature(secret, repId, email);
  if (expected.length !== signature.length) {
    return false;
  }
  return crypto.timingSafeEqual(
    Buffer.from(expected, "utf8"),
    Buffer.from(signature, "utf8"),
  );
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Send a transactional notification email to an elected representative via
 * Amazon SES v2 (`POST /v2/email/outbound-emails`).
 */
export async function sendRepNotificationViaSes(
  params: SendRepNotificationParams,
): Promise<{ messageId: string }> {
  const {
    credentials,
    fromEmail,
    toEmail,
    repName,
    electedOffice,
    districtName,
    constituentName,
    constituentPostcode,
    subjectLine,
    visibility,
    unreadCount,
    unsubscribeUrl,
    registerUrl,
  } = params;

  const emailSubject = `[Vote Social] New constituent message from ${constituentPostcode} (${districtName})`;

  const unreadNote =
    unreadCount > 1
      ? `You currently have ${unreadCount} unread constituent messages waiting on Vote Social.`
      : "You have 1 new constituent message waiting on Vote Social.";

  const textBody = [
    `Hello ${repName} (${electedOffice}, ${districtName}),`,
    "",
    `A constituent in postal zone ${constituentPostcode} (${constituentName}) has sent you a ${visibility} message on Vote Social (https://vote-social.ca) regarding:`,
    `"${subjectLine}"`,
    "",
    unreadNote,
    "",
    "To protect constituent and representative security, you must register and verify your official email address to read and respond to constituent messages on the platform:",
    registerUrl,
    "",
    "---",
    "Vote Social • Canadian Civic Infrastructure (https://vote-social.ca)",
    "At most 1 notification email is sent per representative per 24 hours.",
    `To opt out and stop receiving constituent message notifications from vote-social.ca, click here: ${unsubscribeUrl}`,
  ].join("\n");

  const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; background-color: #f8fafc; padding: 24px; margin: 0;">
  <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 28px;">
    <div style="font-size: 12px; font-family: monospace; text-transform: uppercase; letter-spacing: 0.08em; color: #1d4ed8; font-weight: 700; margin-bottom: 8px;">
      Vote Social • Constituent Communications
    </div>
    <h1 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0;">
      You have received a new constituent message on vote-social.ca
    </h1>
    <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 14px 0;">
      Hello <strong>${escapeHtml(repName)}</strong> (${escapeHtml(electedOffice)} — ${escapeHtml(districtName)}),
    </p>
    <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">
      A constituent in postal zone <strong>${escapeHtml(constituentPostcode)}</strong> (<strong>${escapeHtml(constituentName)}</strong>) has sent you a <strong>${escapeHtml(visibility)}</strong> message on <a href="https://vote-social.ca" style="color: #1d4ed8;">vote-social.ca</a>:
    </p>
    <div style="background: #f1f5f9; border-left: 4px solid #1d4ed8; padding: 12px 16px; border-radius: 6px; margin-bottom: 18px;">
      <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 4px;">Subject</div>
      <div style="font-size: 15px; font-weight: 700; color: #0f172a;">${escapeHtml(subjectLine)}</div>
    </div>
    <p style="font-size: 13px; line-height: 1.6; color: #334155; margin: 0 0 20px 0;">
      ${escapeHtml(unreadNote)} Register and verify your official email address (<strong>${escapeHtml(toEmail)}</strong>) on Vote Social to begin receiving and responding to constituent messages on the platform.
    </p>
    <div style="margin: 24px 0;">
      <a href="${escapeHtml(registerUrl)}" style="display: inline-block; background-color: #1d4ed8; color: #ffffff; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 22px; border-radius: 10px;">
        Verify Official Email &amp; Read Message →
      </a>
    </div>
    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
    <p style="font-size: 11px; line-height: 1.5; color: #64748b; margin: 0;">
      Vote Social sends at most 1 notification email per representative per 24-hour period.<br />
      If you do not wish to receive constituent notifications from vote-social.ca, you can <a href="${escapeHtml(unsubscribeUrl)}" style="color: #64748b; text-decoration: underline;">unsubscribe here</a>.
    </p>
  </div>
</body>
</html>`;

  const host = `email.${credentials.region}.amazonaws.com`;
  const path = "/v2/email/outbound-emails";
  const bodyJson = JSON.stringify({
    FromEmailAddress: `Vote Social <${fromEmail}>`,
    Destination: {
      ToAddresses: [toEmail],
    },
    Content: {
      Simple: {
        Subject: {
          Data: emailSubject,
          Charset: "UTF-8",
        },
        Body: {
          Text: {
            Data: textBody,
            Charset: "UTF-8",
          },
          Html: {
            Data: htmlBody,
            Charset: "UTF-8",
          },
        },
        Headers: [
          {
            Name: "List-Unsubscribe",
            Value: `<${unsubscribeUrl}>`,
          },
        ],
      },
    },
  });

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const service = "ses";
  const payloadHash = sha256Hex(bodyJson);

  const canonicalHeaders =
    `content-type:application/json\n` +
    `host:${host}\n` +
    `x-amz-date:${amzDate}\n`;
  const signedHeaders = "content-type;host;x-amz-date";
  const canonicalRequest = [
    "POST",
    path,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const algorithm = "AWS4-HMAC-SHA256";
  const credentialScope = `${dateStamp}/${credentials.region}/${service}/aws4_request`;
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const kDate = hmacSha256(`AWS4${credentials.secretAccessKey}`, dateStamp);
  const kRegion = hmacSha256(kDate, credentials.region);
  const kService = hmacSha256(kRegion, service);
  const kSigning = hmacSha256(kService, "aws4_request");
  const signature = crypto
    .createHmac("sha256", kSigning)
    .update(stringToSign, "utf8")
    .digest("hex");

  const authorizationHeader =
    `${algorithm} Credential=${credentials.accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: host,
        port: 443,
        path,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(bodyJson),
          "X-Amz-Date": amzDate,
          Authorization: authorizationHeader,
        },
      },
      (res) => {
        let rawData = "";
        res.on("data", (chunk) => {
          rawData += chunk;
        });
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = JSON.parse(rawData) as { MessageId?: string };
              resolve({ messageId: parsed.MessageId ?? "sent" });
            } catch {
              resolve({ messageId: "sent" });
            }
          } else {
            reject(
              new Error(
                `SES HTTP ${res.statusCode ?? 500}: ${rawData.slice(0, 400)}`,
              ),
            );
          }
        });
      },
    );

    req.on("error", (err) => reject(err));
    req.write(bodyJson);
    req.end();
  });
}
