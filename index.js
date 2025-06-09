import express from 'express'
import puppeteer from 'puppeteer'

const app = express()
app.use(express.json())

app.post('/screenshot', async (req, res) => {
  const { html } = req.body

  if (!html) return res.status(400).send('Missing HTML')

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  const page = await browser.newPage()

  await page.setContent(html, { waitUntil: 'domcontentloaded' })

  // ⏳ Ждём, пока background-картинки загрузятся
  await page.evaluate(() => {
    return new Promise<void>((resolve) => {
      const checkImages = () => {
        const elements = Array.from(document.querySelectorAll('*'))
        const bgUrls = elements
          .map(el => getComputedStyle(el).backgroundImage)
          .filter(bg => bg && bg !== 'none')
          .map(bg => {
            const match = bg.match(/url\\(["']?(.*?)["']?\\)/)
            return match ? match[1] : null
          })
          .filter(Boolean)

        if (bgUrls.length === 0) return resolve()

        let loaded = 0
        bgUrls.forEach(url => {
          const img = new Image()
          img.onload = img.onerror = () => {
            loaded++
            if (loaded === bgUrls.length) resolve()
          }
          img.src = url
        })
      }

      checkImages()
    })
  })

  const screenshot = await page.screenshot({ type: 'png' })
  await browser.close()

  res.setHeader('Content-Type', 'image/png')
  res.send(screenshot)
})

const port = process.env.PORT || 3000
app.listen(port, () => console.log(`✅ Server running on port ${port}`))
