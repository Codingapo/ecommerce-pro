import { randomUUID } from "node:crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { requireAdmin } from "@/lib/auth";
import { secret } from "@/lib/env";
import { AppError, failure, sameOrigin } from "@/lib/http";
import { rateLimit } from "@/lib/limits";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { user } = await requireAdmin();
    await rateLimit(`upload:${user.id}`, 30);
    if (Number(request.headers.get("content-length") || 0) > 3500000)
      throw new AppError(413, "Use an image under 3 MB.");
    const file = (await request.formData()).get("file");
    if (
      !(file instanceof File) ||
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 3000000 ||
      file.size < 1
    )
      throw new AppError(400, "Choose a JPEG, PNG or WebP image under 3 MB.");
    const buffer = await sharp(Buffer.from(await file.arrayBuffer()), {
      limitInputPixels: 25000000,
    })
      .rotate()
      .resize(1800, 1800, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
    const key = `products/${randomUUID()}.webp`;
    const client = new S3Client({
      region: "auto",
      endpoint: `https://${secret("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: secret("R2_ACCESS_KEY_ID"),
        secretAccessKey: secret("R2_SECRET_ACCESS_KEY"),
      },
    });
    await client.send(
      new PutObjectCommand({
        Bucket: secret("R2_BUCKET_NAME"),
        Key: key,
        Body: buffer,
        ContentType: "image/webp",
        CacheControl: "public,max-age=31536000,immutable",
      }),
    );
    return Response.json({
      url: `${secret("R2_PUBLIC_URL").replace(/\/$/, "")}/${key}`,
    });
  } catch (error) {
    return failure(error);
  }
}
