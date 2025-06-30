import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3Client = new S3Client({
  region: process.env.AWS_REGION_!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID_!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_!,
  },
})

export async function uploadToS3(file: Buffer, key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME_!,
    Key: key,
    Body: file,
    ContentType: contentType,
  })

  await s3Client.send(command)
  return `https://${process.env.AWS_S3_BUCKET_NAME_}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
}

export async function getSignedDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME_!,
    Key: key,
  })

  return await getSignedUrl(s3Client, command, { expiresIn: 3600 })
}

export { s3Client }
