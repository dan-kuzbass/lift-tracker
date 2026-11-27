import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const root = process.cwd()
const publicDir = path.join(root, 'public')
const iconsDir = path.join(publicDir, 'icons')
await mkdir(iconsDir, { recursive: true })

const logo = await readFile(path.join(publicDir, 'logo.svg'))

async function render(size, output, options = {}) {
  let image = sharp(logo, { density: 1200 }).resize(options.inner ?? size, options.inner ?? size)
  if (options.padding) {
    const canvas = 512
    image = image.resize(canvas - options.padding * 2, canvas - options.padding * 2)
    image = sharp({
      create: {
        width: canvas,
        height: canvas,
        channels: 4,
        background: '#0A0E13',
      },
    }).composite([{ input: await image.png().toBuffer(), gravity: 'center' }])
  }
  await image.png().toFile(path.join(iconsDir, output))
}

await render(192, 'pwa-192x192.png')
await render(512, 'pwa-512x512.png')
await render(512, 'maskable-512x512.png', { padding: 88 })
await render(180, 'apple-touch-icon.png')
await render(32, 'favicon-32.png')

const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#0A0E13"/></svg>`
await writeFile(path.join(publicDir, 'icons', 'maskable-background.svg'), maskableSvg)
console.log('PWA icons generated')
