import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  coursePdfUploader: f({ pdf: { maxFileSize: "16MB" } })
    // Set permissions and file types for this FileRoute
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for pdf file:", file.url);
      return { url: file.url, name: file.name };
    }),
  courseMaterial: f({ pdf: { maxFileSize: "16MB" }, image: { maxFileSize: "16MB" }, video: { maxFileSize: "128MB" }, blob: { maxFileSize: "128MB" } })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for material:", file.url);
      return { url: file.url, name: file.name };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
