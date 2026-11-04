import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest): Promise<Response> {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const isFixture = formData.get("isFixture") === "true";

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const uploadOptions: any = {
    quality: 90,
  };

  if (isFixture) {
    uploadOptions.public_id = "bracket_template";
    uploadOptions.folder = "fixtures";
    uploadOptions.overwrite = true;
  } else {
    uploadOptions.tags = ["profile-picture"];
  }

  try {
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        },
      ).end(buffer);
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    return NextResponse.json(
      { error: "Image could not be uploaded" },
      { status: 500 }
    );
  }
}
