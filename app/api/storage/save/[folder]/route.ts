
import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(
  request: NextRequest,
  { params }: { params: { folder: string } }
) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return Response.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Create folder structure
    const folderPath = path.join(process.cwd(), 'storage', 'recordings', params.folder);
    await mkdir(folderPath, { recursive: true });

    // Save file to folder
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const filePath = path.join(folderPath, audioFile.name);
    await writeFile(filePath, buffer);

    return Response.json({ 
      success: true,
      filePath: `/storage/recordings/${params.folder}/${audioFile.name}`
    });
  } catch (error) {
    console.error('Error saving audio:', error);
    return Response.json({ error: 'Failed to save audio file' }, { status: 500 });
  }
}
