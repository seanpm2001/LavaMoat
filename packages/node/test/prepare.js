// @ts-check

'use strict'

const path = require('node:path')
const { execFile } = require('node:child_process')
const { promisify } = require('node:util')
const { rm, readdir } = require('node:fs/promises')

const exec = promisify(execFile)

const LAVAMOAT_PM = process.env.LAVAMOAT_PM ?? 'npm@latest'
const PROJECTS_DIR = path.join(__dirname, 'projects')

async function clean(cwd) {
  await rm(path.join(cwd, 'node_modules'), { recursive: true, force: true })
}

async function setup(cwd) {

  if (process.version.startsWith('v14')) {
    const pm = LAVAMOAT_PM.startsWith('npm') ? 'npm' : 'yarn'
    // forcing npm registry as for whatever reason yarn will barf with the
    // opaque error "Invalid value type 8:0" if we use its own registry
    const args = pm === 'yarn' ? ['--registry=https://registry.npmjs.org'] : []
    console.warn(`Node.js ${process.version} cannot use corepack; attempting to use system ${pm}`)
    await exec(pm, ['install', ...args], { cwd })
    await exec(pm, ['run', 'setup'], { cwd })
  } else {
    await exec('corepack', [LAVAMOAT_PM, 'install'], { cwd })
    await exec('corepack', [LAVAMOAT_PM, 'run', 'setup'], { cwd })
  }
  await exec('node', [require.resolve('../src/cli'), '-a', 'index.js'], {
    cwd,
  })

}

async function main() {
  const dirents = await readdir(PROJECTS_DIR, { withFileTypes: true })

  await Promise.all(
    dirents
      .filter((dirent) => dirent.isDirectory())
      .map(async ({ name }) => {
        const cwd = path.join(PROJECTS_DIR, name)
        const relative = path.relative(process.cwd(), cwd)
        console.error(
          'Setting up %s using %s...',
          relative,
          LAVAMOAT_PM,
        )

        await clean(cwd)
        await setup(cwd)

        console.error(
          'Finished setting %s using %s',
          relative,
          LAVAMOAT_PM,
        )
      }),
  )
  console.error('Ready')
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
}
