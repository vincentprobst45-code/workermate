import { Injectable, Logger } from '@nestjs/common';
import { GetObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client, CreateBucketCommand } from '@aws-sdk/client-s3';
import { Readable } from 'node:stream';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly bucket = process.env.MINIO_BUCKET ?? 'workermate';
  private readonly client = new S3Client({
    endpoint: process.env.MINIO_ENDPOINT ?? 'http://localhost:9000',
    region: process.env.MINIO_REGION ?? 'us-east-1',
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.MINIO_ACCESS_KEY ?? process.env.MINIO_ROOT_USER ?? 'artisano',
      secretAccessKey: process.env.MINIO_SECRET_KEY ?? process.env.MINIO_ROOT_PASSWORD ?? 'artisano-dev-password',
    },
  });

  async putObject(key: string, body: Buffer, contentType: string) {
    await this.ensureBucket();
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      ContentLength: body.length,
    }));
  }

  async getObject(key: string): Promise<Buffer> {
    const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    if (!result.Body) {
      throw new Error(`Le fichier ${key} est vide ou introuvable.`);
    }
    if (Buffer.isBuffer(result.Body)) return result.Body;
    if (result.Body instanceof Readable) {
      const chunks: Buffer[] = [];
      const body = result.Body as AsyncIterable<Uint8Array>;
      for await (const chunk of body) chunks.push(Buffer.from(chunk));
      return Buffer.concat(chunks);
    }
    return Buffer.from(await result.Body.transformToByteArray());
  }

  private async ensureBucket() {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
      } catch (error) {
        this.logger.error(`Impossible de créer le bucket MinIO ${this.bucket}`, error);
        throw error;
      }
    }
  }
}
