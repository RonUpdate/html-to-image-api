import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import puppeteer from 'puppeteer'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
app.use(express.json())

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
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const screenshot = await page.screenshot({ type: 'png' })

    await browser.close()

    res.set('Content-Type', 'image/png')
    res.send(screenshot)
  } catch (err) {
    console.error('Generation error:', err)
    res.status(500).json({ error: 'Failed to generate image' })
  }
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
