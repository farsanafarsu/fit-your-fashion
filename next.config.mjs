// GitHub Pages serves a project site from /<repo-name>/. The deploy workflow sets
// NEXT_PUBLIC_BASE_PATH to that prefix; locally it is empty and nothing changes.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export", // plain HTML/CSS/JS in out/, which is what GitHub Pages can host
  trailingSlash: true, // /dressing-room/ -> dressing-room/index.html
  basePath,
  images: { loader: "custom", loaderFile: "./lib/image-loader.js" },
};

export default nextConfig;
