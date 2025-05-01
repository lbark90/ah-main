import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import path from 'path';

export async function GET(request: Request, { params }: { params: { folder: string } }) {
    try {
        const storage = new Storage({
            keyFilename: './credentials/gcp-credentials.json'
        });

        const bucketName = process.env.GCP_BUCKET_NAME;

        if (!bucketName) {
            console.error('GCP_BUCKET_NAME not set');
            return NextResponse.json({ error: 'Storage configuration missing' }, { status: 500 });
        }

        const bucket = storage.bucket(bucketName);
        const prefix = `${params.folder}/`;

        console.log(`Listing files in bucket: ${bucketName} with prefix: ${prefix}`);

        const [files] = await bucket.getFiles({ prefix });
        const fileNames = files.map(file => file.name.split('/').pop());

        console.log(`Found ${fileNames.length} files:`, fileNames);

        return NextResponse.json(fileNames);
    } catch (error) {
        console.error('Error listing files:', error);
        return NextResponse.json({ error: 'Failed to list recordings' }, { status: 500 });
    }
}