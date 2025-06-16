import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import puppeteer from 'puppeteer'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { randomUUID } from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
app.use(express.json())

// Статическая отдача файлов
const publicDir = join(__dirname, 'public')
if (!existsSync(publicDir)) mkdirSync(publicDir)
app.use('/public', express.static(publicDir))

app.post('/generate', async (req, res) => {
  const { html } = req.body

  if (!html) {
    return res.status(400).json({ error: 'Missing HTML content' })
  }

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    await page.setViewport({ width: 1000, height: 1500 })
    await page.emulateMediaType('screen')
    await page.setContent(html, { waitUntil: 'networkidle0' })

    const screenshot = await page.screenshot({ type: 'png', fullPage: false })
    await browser.close()

    // Сохраняем файл
    const fileName = `${randomUUID()}.png`
    const filePath = join(publicDir, fileName)
    writeFileSync(filePath, screenshot)

    // Отдаём публичную ссылку
    const publicUrl = `https://${process.env.RAILWAY_STATIC_URL || 'your-app-name.up.railway.app'}/public/${fileName}`
    res.json({ url: publicUrl })
  } catch (err) {
    console.error('Generation error:', err)
    res.status(500).json({ error: 'Failed to generate image' })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
