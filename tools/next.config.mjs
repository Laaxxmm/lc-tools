/** @type {import('next').NextConfig} */
export default {
  output: 'export',
  basePath: '/tools',
  trailingSlash: true,          // required: Apache resolves /tools/x/ -> /tools/x/index.html
  images: { unoptimized: true },
}
