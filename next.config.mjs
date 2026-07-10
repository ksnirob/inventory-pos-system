/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Product images are limited to 2 MB in the form. Leave room for the
    // multipart/form-data fields that accompany the file in the Server Action.
    serverActions: {
      bodySizeLimit: "3mb"
    }
  }
};

export default nextConfig;
