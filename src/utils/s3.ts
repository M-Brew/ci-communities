import dotenv from "dotenv";
import { S3Client } from "@aws-sdk/client-s3";

dotenv.config();

const { S3_BUCKET_REGION, S3_BUCKET_ACCESS_KEY, S3_BUCKET_SECRET_ACCESS_KEY } =
  process.env;

const s3 = new S3Client({
  credentials: {
    accessKeyId: S3_BUCKET_ACCESS_KEY,
    secretAccessKey: S3_BUCKET_SECRET_ACCESS_KEY,
  },
  region: S3_BUCKET_REGION,
});

export { s3 };
