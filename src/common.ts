import { createHash } from 'crypto'
import { access, constants, lstat, outputFile, readFile } from 'fs-extra'
import { safeLoad, safeDump } from 'js-yaml'
import { resolve } from 'path'

export async function isFile(...parts: any[]): Promise<boolean> {
  try {
    let cat = resolve(...parts)
    await access(cat, constants.F_OK)
    return (await lstat(cat)).isFile()
  } catch {
    return false
  }
}

export async function inputYAML<T extends object>(source: string, defaults: T) {
  if (!await isFile(source)) {
    await outputYAML(source, defaults)
    return defaults
  } else {
    const data = safeLoad(await readFile(resolve(source), { encoding: 'utf8' }))
    return Object.assign({}, defaults, data) as T
  }
}

export function outputYAML(target: string, data: any) {
  return outputFile(resolve(target), safeDump(data))
}

export function getSHA512(data: string) {
  const hash = createHash('sha512')
  hash.update(data)
  return hash.digest('base64')
}
