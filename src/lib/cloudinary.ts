import { v2 as cloudinary } from 'cloudinary';

// Initialize Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Universal function to upload any media file to Cloudinary.
 * @param fileBuffer Buffer of the file to upload
 * @param folderName Folder in Cloudinary where the file should be stored
 * @returns The secure URL of the uploaded file
 */
export async function uploadMediaToCloudinary(fileBuffer: Buffer, folderName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folderName,
        resource_type: "auto", // Automatically detects image, video, or raw (e.g., pdf)
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          reject(error);
        } else if (result) {
          resolve(result.secure_url);
        } else {
          reject(new Error("Unknown Cloudinary upload error"));
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
}

/**
 * Deletes a file from Cloudinary given its public ID
 * @param publicId The public ID of the file to delete (e.g., 'chat-media/filename')
 */
export async function deleteMediaFromCloudinary(publicId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        console.error("Cloudinary delete error:", error);
        reject(error);
      } else {
        resolve();
      }
    });
  });
}
