#!/usr/bin/env node
import express from 'express'
import cors from 'cors'
import fileUpload from 'express-fileupload'
import fs from 'fs'
import path from 'path'
import indexHtml from  './index.js'
import os from 'os'

const app = express()
app.use(cors())
app.use(fileUpload({ createParentPath: true, useTempFiles: true }))
app.use(express.json())
app.use('/files', express.static('files'))

// 文件列表接口
app.get('/list', (req, res) => {
  const dir = path.resolve('files')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.readdir(dir, (err, entries) => {
    if (err) return res.status(500).json({ code: 500, msg: '读取目录失败' })
    const data = entries
      .filter(name => fs.statSync(path.join(dir, name)).isFile())
      .map(name => ({
        name,
        size: fs.statSync(path.join(dir, name)).size,
      }))
    res.json({ code: 200, msg: 'ok', data })
  })
})

// 上传接口（返回 JSON）
app.post('/upload', (req, res) => {
  if (!req.files || !req.files.files) {
    return res.status(400).json({ code: 400, msg: '请选择一个或多个文件' })
  }
  let { files } = req.files
  if (!Array.isArray(files)) files = [files]
  const data = []
  files.forEach(file => {
    file.name = new TextDecoder().decode(Uint8Array.from(file.name, c => c.charCodeAt(0)))
    console.log(file)
    file.mv('./files/' + file.name)
    data.push({
      name: file.name,
      mimetype: file.mimetype,
      size: file.size,
    })
  })
  res.json({ code: 200, msg: 'ok', data })
})

app.get('/', (req, res) => res.send(indexHtml))

const argv = process.argv.slice(2)
const port = argv[0] || 3001
const ip = Object.values(os.networkInterfaces()).flat().find(v => v.family === 'IPv4').address
app.listen(port, () => console.log(`🚀 server running at http://${ip}:${port}`))
