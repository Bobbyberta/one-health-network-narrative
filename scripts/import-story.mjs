import fs from 'fs'
import {
  PATHS,
  applyAnchor,
  parseNarrativeMd,
  readCompileLog,
  readStoryData,
  writeCompileLog,
  writeIntro,
  writeStoryData,
} from './story-narrative.mjs'

function importStory() {
  if (!fs.existsSync(PATHS.narrativeMd)) {
    console.error(`Missing ${PATHS.narrativeMd}. Run npm run export:story first.`)
    process.exit(1)
  }

  const content = fs.readFileSync(PATHS.narrativeMd, 'utf8')
  const blocks = parseNarrativeMd(content)

  if (blocks.length === 0) {
    console.error('No anchored text blocks found in story_narrative.md')
    process.exit(1)
  }

  const storyData = readStoryData()
  const introUpdates = {}
  const compileLogUpdates = {}
  const seenAnchors = new Set()

  for (const { anchor, text } of blocks) {
    if (seenAnchors.has(anchor)) {
      console.error(`Duplicate anchor found: ${anchor}`)
      process.exit(1)
    }
    seenAnchors.add(anchor)
    applyAnchor(storyData, anchor, text, introUpdates, compileLogUpdates)
  }

  writeStoryData(storyData)

  if (Object.keys(introUpdates).length > 0) {
    writeIntro(introUpdates)
  }

  if (Object.keys(compileLogUpdates).length > 0) {
    const compileLog = readCompileLog()
    for (const [index, text] of Object.entries(compileLogUpdates)) {
      compileLog[parseInt(index, 10)] = text
    }
    writeCompileLog(compileLog)
  }

  console.log(`Imported ${blocks.length} text blocks from ${PATHS.narrativeMd}`)
  console.log('Updated story_data.json and src/data/story_data.json')
  if (Object.keys(introUpdates).length > 0) {
    console.log('Updated src/config/intro.ts')
  }
  if (Object.keys(compileLogUpdates).length > 0) {
    console.log('Updated src/config/metrics.ts')
  }
}

importStory()
