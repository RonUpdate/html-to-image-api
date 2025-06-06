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
  const screenshot = await page.screenshot({ type: 'png' })

  await browser.close()
  res.setHeader('Content-Type', 'image/png')
  res.send(screenshot)
})

const port = process.env.PORT || 3000
app.listen(port, () => console.log(`Server running on port ${port}`))
