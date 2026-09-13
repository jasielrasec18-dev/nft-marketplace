import lighthouse from 'lighthouse'
import desktop from 'lighthouse/core/config/desktop-config.js'
import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
const runs = Number(process.argv[2] ?? 3)
if (!Number.isInteger(runs) || runs < 1 || runs > 3) throw new Error('Use 1 to diagnose or 3 for acceptance.')
const directory = 'reports/lighthouse' + (runs === 3 ? '' : '/diagnostic')
await mkdir(directory, { recursive: true })
const origin = 'http://127.0.0.1:4174'
const preview = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4174', '--strictPort'], { stdio: 'ignore', windowsHide: true })
const results = []
try {
  let ready = false
  for (let attempt = 0; attempt < 100; attempt++) {
    try { if ((await fetch(origin)).ok) { ready = true; break } } catch { /* starting */ }
    await delay(200)
  }
  if (!ready) throw new Error('Optimized preview did not start on port 4174.')
  for (const [page, path] of [['home', '/'], ['detail', '/nfts/nft-001']]) for (const profile of ['desktop', 'mobile']) for (let run = 1; run <= runs; run++) {
    const browser = await chromium.launch({ headless: true, args: ['--remote-debugging-port=9222'] })
    try {
      const result = await lighthouse(origin + path, { port: 9222, output: ['html', 'json'], logLevel: 'error' }, profile === 'desktop' ? desktop : undefined)
      if (!result || result.lhr.runtimeError) throw new Error(JSON.stringify(result?.lhr.runtimeError ?? 'Missing report'))
      const stem = directory + '/' + page + '-' + profile + '-' + run
      await writeFile(stem + '.html', result.report[0])
      await writeFile(stem + '.json', result.report[1])
      const { categories, audits } = result.lhr
      const row = { page, profile, run, performance: categories.performance.score * 100, accessibility: categories.accessibility.score * 100, bestPractices: categories['best-practices'].score * 100, seo: categories.seo.score * 100, lcp: audits['largest-contentful-paint'].numericValue, cls: audits['cumulative-layout-shift'].numericValue, tbt: audits['total-blocking-time'].numericValue }
      results.push(row)
      console.log(JSON.stringify(row))
    } finally { await browser.close() }
  }
  const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
  const medians = []
  for (const page of ['home', 'detail']) for (const profile of ['desktop', 'mobile']) {
    const rows = results.filter((row) => row.page === page && row.profile === profile)
    medians.push({ page, profile, ...Object.fromEntries(['performance', 'accessibility', 'bestPractices', 'seo', 'lcp', 'cls', 'tbt'].map((key) => [key, median(rows.map((row) => row[key]))])) })
  }
  await writeFile(directory + '/summary.json', JSON.stringify({ measuredAt: new Date().toISOString(), runs, lighthouse: '13.4.1', node: process.version, results, medians }, null, 2) + '\n')
  if (medians.some((row) => row.performance < 90 || row.accessibility < 95 || row.bestPractices < 95 || row.seo < 90)) process.exitCode = 1
} finally { preview.kill() }
