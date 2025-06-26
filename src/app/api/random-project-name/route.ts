import { NextResponse } from 'next/server'
import { uniqueNamesGenerator, Config, adjectives, colors, animals } from 'unique-names-generator'

const customConfig: Config = {
  dictionaries: [adjectives, colors, animals],
  separator: ' ',
  style: 'capital',
  length: 3,
}

export async function GET() {
  try {
    const randomName = uniqueNamesGenerator(customConfig)
    return NextResponse.json({ name: randomName })
  } catch (error) {
    console.error('[random-project-name] Error:', error)
    return NextResponse.json({ error: 'Failed to generate name' }, { status: 500 })
  }
}