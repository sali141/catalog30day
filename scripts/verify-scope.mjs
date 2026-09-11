import { readdir, readFile } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'
import process from 'node:process'

const sourceRoot = new URL('../src/', import.meta.url)
const forbidden = [
  ['unapproved milestone number', /day\s*90/i],
  ['exploratory marker', /future\s*[·.-]?\s*optional/i],
  ['pay as you go', /pay[ -]as[ -]you[ -]go|\bpayg\b/i],
  ['runtime/downstream routing', /downstream target|\bOCS\b|\bPCF\b/i],
  ['affinity implementation', /affinityDiscount|membershipOptions|\bUSAA\b/i],
  ['device finance', /installment|device payment|device balance|lease|rental/i],
  ['promotion surfaces', /promotion studio|engagement studio/i],
]

async function collect(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await collect(path))
    else if (['.ts', '.tsx', '.css'].includes(extname(entry.name))) files.push(path)
  }
  return files
}

const rootPath = decodeURIComponent(sourceRoot.pathname).replace(/^\/(.:)/, '$1')
const failures = []

for (const file of await collect(rootPath)) {
  const contents = await readFile(file, 'utf8')
  for (const [label, pattern] of forbidden) {
    if (pattern.test(contents)) failures.push(`${relative(rootPath, file)}: ${label}`)
  }
}

if (failures.length) {
  console.error(`Scope verification failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}

console.log('Scope verification passed: source contains only the approved handoff surface.')
