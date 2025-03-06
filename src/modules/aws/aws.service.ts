import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@aws-sdk/node-http-handler';
import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { awsConfig } from 'src/common/constants';

@Injectable()
export class AwsService {
  private s3Client: S3Client;
  private logger = new Logger(AwsService.name);

  constructor() {
    this.s3Client = new S3Client({
      ...awsConfig.client,
      requestHandler: new NodeHttpHandler({
        socketTimeout: awsConfig.timeout.socket,
        connectionTimeout: awsConfig.timeout.connection,
      }),
    });
  }

  async uploadFile(file: Express.Multer.File, id: string) {
    const fileExtensionsByMimetype: { [key: string]: string } = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/tiff': 'tiff',
      'image/bmp': 'bmp',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        'docx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        'xlsx',
      'application/vnd.ms-powerpoint': 'ppt',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        'pptx',
      'application/zip': 'zip',
      'application/x-rar-compressed': 'rar',
      'text/plain': 'txt',
      'text/csv': 'csv',
      'application/json': 'json',
    };
    let key = '';
    try {
      const { mimetype, filename } = file;
      const extension = fileExtensionsByMimetype[mimetype] ?? 'file';
      key = `user_${id}/${filename}_${crypto.randomUUID()}.${extension}`;
      if (mimetype) {
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: awsConfig.s3.bucket,
            ContentType: mimetype,
            Key: key,
            Body: file.buffer,
          }),
        );
      }
      return {
        url: `https://${awsConfig.s3.bucket}.s3.${awsConfig.client.region}.amazonaws.com/${key}`,
        key,
      };
    } catch (err) {
      this.logger.error(`Error uploading `, (err as Error).stack);
      this.deleteFile(key)
    }
  }

  async deleteFile(fileKey: string) {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: awsConfig.s3.bucket,
          Key: fileKey,
        }),
      )
      this.logger.log(`File deleted successfully ${fileKey}`);
    } catch (error) {
      this.logger.error(`Error deleting file`, (error as Error).stack);
    }
  }
}