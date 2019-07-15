import { getSHA512 } from './common'
import { mkdirs, writeFile } from 'fs-extra'

export async function makeUser(id: string) {
  if (!/^[a-zA-Z0-9\-_]+$/.test(id)) {
    console.log(`'${id}' is not a valid identity. Identities may only contain alphanumeric characters, hyphens, and underscores.`)
    return 1
  }
  try {
    const secret = getSHA512(String(Date.now()))
    const hash = getSHA512(secret)
    await mkdirs('./identities')
    await writeFile(`./identities/${id}`, hash, { encoding: 'utf8' })
    console.log('Keep this key in a safe place, since it can only be printed here once:')
    console.log(secret)
  } catch (err) {
    console.log(`Couldn't create identity due to ${err}`)
    return 1
  }
  return 0
}
