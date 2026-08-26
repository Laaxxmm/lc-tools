/** @type {import('next').NextConfig} */
export default {
  output: 'export',
  basePath: '/tools',
  trailingSlash: true,          // required: Apache resolves /tools/x/ -> /tools/x/index.html
  images: { unoptimized: true },
  // Production builds write to their own directory so running `npm run build`
  // never clobbers the chunks a running `next dev` is serving.
  distDir: process.env.NEXT_DIST_DIR || '.next',
}
