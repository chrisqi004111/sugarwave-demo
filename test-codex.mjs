// 诊断脚本 #2：真实合成任务——看 codex 是调真正的图像生成模型，还是用代码糊弄
import { spawn } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'

const workDir = path.join(os.tmpdir(), 'codex-composite-test') // 由 PowerShell 预先放好 space/product/mask.png
const codexCmd = 'C:\\Users\\QI\\AppData\\Roaming\\npm\\codex.cmd'

const prompt =
  'Three PNG files are in the current working directory: space.png (a real photo of a living room), ' +
  'product.png (a Boop table lamp, ~18cm), and mask.png (a black/white mask where WHITE marks the region to edit). ' +
  'Produce a photorealistic image named result.png (1024x1024) where the lamp from product.png is naturally placed ' +
  'into the WHITE masked region of space.png, matching the room perspective, lighting and shadows, with everything ' +
  'outside the mask unchanged. Use a real generative image model / image-generation tool if you have one. ' +
  'Do not ask questions.'

const args = [
  '/d', '/s', '/c', codexCmd,
  'exec', prompt,
  '-C', workDir,
  '-s', 'workspace-write',
  '--skip-git-repo-check',
  '-i', path.join(workDir, 'space.png'),
  '-i', path.join(workDir, 'product.png'),
  '-i', path.join(workDir, 'mask.png'),
]

const t0 = Date.now()
const el = () => ((Date.now() - t0) / 1000).toFixed(1) + 's'
console.log(`[${el()}] spawning codex for REAL composite task...`)

const child = spawn('cmd.exe', args, { cwd: workDir })
child.stdin.end()
child.stdout.on('data', d => process.stdout.write(`[${el()}][out] ${d}`))
child.stderr.on('data', d => process.stdout.write(`[${el()}][err] ${d}`))

const timer = setTimeout(() => {
  console.log(`[${el()}] TIMEOUT 240s → taskkill /T`)
  spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'])
}, 240000)

child.on('close', code => {
  clearTimeout(timer)
  console.log(`[${el()}] closed code=${code}`)
  console.log(`[${el()}] files: ${JSON.stringify(fs.readdirSync(workDir))}`)
  const out = path.join(workDir, 'result.png')
  if (fs.existsSync(out)) console.log(`[${el()}] result.png = ${fs.statSync(out).size} bytes`)
  else console.log(`[${el()}] NO result.png`)
})
