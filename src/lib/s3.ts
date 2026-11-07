import crypto from "crypto";

/**
 * Minimal S3-compatible storage client for Neon Object Storage.
 *
 * Neon's object storage is S3 compatible but:
 *  - objects are private (bucket policies / ACLs are not implemented), and
 *  - a bucket must exist before objects can be written.
 *
 * Because objects cannot be made public, the app never exposes the raw
 * storage URL. Instead uploads are served through `/api/uploads/<key>`,
 * which signs a server-side GET. That keeps the returned "live" URL stable,
 * public, same-origin (so `next/image` and canvas exports work) and free of
 * CORS problems.
 */

const endpoint = (process.env.S3_ENDPOINT_URL || "").replace(/\/+$/, "");
const accessKeyId = process.env.S3_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || "";
const region = process.env.S3_REGION || "us-east-1";

export const STORAGE_BUCKET = (process.env.S3_BUCKET || "psimply").trim();

export function isStorageConfigured(): boolean {
  return Boolean(endpoint && accessKeyId && secretAccessKey && STORAGE_BUCKET);
}

function sha256Hex(data: Buffer | string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function hmac(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac("sha256", key).update(data).digest();
}

function buildSignedRequest(
  method: "GET" | "PUT" | "HEAD",
  key: string,
  body: Buffer = Buffer.alloc(0),
  contentType?: string,
): { url: string; headers: Record<string, string> } {
  const host = new URL(endpoint).host;
  const amzDate =
    new Date().toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 15) + "Z";
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256Hex(body);

  // Path-style URL: /<bucket>/<key>. The bucket is created on demand and
  // the key may contain slashes (folders), so encode each segment.
  const canonicalUri =
    "/" +
    [STORAGE_BUCKET, ...key.split("/").filter(Boolean)]
      .map((segment) => encodeURIComponent(segment))
      .join("/");

  const signedHeaderPairs: Record<string, string> = {
    host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };
  if (contentType) {
    signedHeaderPairs["content-type"] = contentType;
  }

  const headerNames = Object.keys(signedHeaderPairs).sort();
  const canonicalHeaders =
    headerNames.map((name) => `${name}:${signedHeaderPairs[name]}`).join("\n") +
    "\n";
  const signedHeaders = headerNames.join(";");

  const canonicalRequest = [
    method,
    canonicalUri,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const kDate = hmac("AWS4" + secretAccessKey, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, "s3");
  const kSigning = hmac(kService, "aws4_request");
  const signature = crypto
    .createHmac("sha256", kSigning)
    .update(stringToSign)
    .digest("hex");

  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    url: `${endpoint}${canonicalUri}`,
    headers: {
      // `host` is signed above but set automatically by fetch/undici;
      // setting it manually can be rejected.
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
      ...(contentType ? { "content-type": contentType } : {}),
      Authorization: authorization,
    },
  };
}

async function send(
  method: "GET" | "PUT" | "HEAD",
  key: string,
  body: Buffer = Buffer.alloc(0),
  contentType?: string,
): Promise<Response> {
  const { url, headers } = buildSignedRequest(method, key, body, contentType);

  return fetch(url, {
    method,
    headers,
    body: method === "PUT" ? body : undefined,
    // Storage responses must not be cached by the platform.
    cache: "no-store",
  });
}

async function ensureBucket(): Promise<void> {
  const res = await send("PUT", "");
  // 200 = created, 409 = already exists / owned by us.
  if (res.ok || res.status === 409) {
    return;
  }

  const details = await res.text().catch(() => "");
  throw new Error(
    `Storage bucket "${STORAGE_BUCKET}" is unavailable (${res.status}). ${details}`.trim(),
  );
}

export async function putObject(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<Response> {
  if (!isStorageConfigured()) {
    throw new Error("Object storage is not configured.");
  }

  const res = await send("PUT", key, body, contentType);

  // The bucket may not exist yet (fresh Neon storage). Create it and retry
  // instead of failing the upload.
  if (res.status === 404) {
    const details = await res.text().catch(() => "");
    if (details.includes("NoSuchBucket")) {
      await ensureBucket();
      return send("PUT", key, body, contentType);
    }
    return new Response(details, {
      status: res.status,
      statusText: res.statusText,
    });
  }

  return res;
}

export async function getObject(key: string): Promise<Response> {
  if (!isStorageConfigured()) {
    throw new Error("Object storage is not configured.");
  }
  return send("GET", key);
}
