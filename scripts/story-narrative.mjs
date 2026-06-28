import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const ROOT = path.resolve(__dirname, '..')

export const PATHS = {
  storyJson: path.join(ROOT, 'story_data.json'),
  storyJsonSrc: path.join(ROOT, 'src/data/story_data.json'),
  narrativeMd: path.join(ROOT, 'story_narrative.md'),
  introTs: path.join(ROOT, 'src/config/intro.ts'),
  metricsTs: path.join(ROOT, 'src/config/metrics.ts'),
}

export function readStoryData() {
  return JSON.parse(fs.readFileSync(PATHS.storyJson, 'utf8'))
}

export function writeStoryData(data) {
  const json = `${JSON.stringify(data, null, 2)}\n`
  fs.writeFileSync(PATHS.storyJson, json)
  fs.writeFileSync(PATHS.storyJsonSrc, json)
}

export function anchorLine(path, meta) {
  const suffix = meta ? ` · ${meta}` : ''
  return `<!-- @${path}${suffix} -->`
}

export function block(path, text, meta) {
  return `${anchorLine(path, meta)}\n${text}\n`
}

export function formatSender(sender) {
  return sender.replace(/_/g, ' ')
}

export function formatChoiceMeta(option) {
  const parts = [`${option.time_cost_mins} min`]
  const delta = option.metrics_delta
  if (delta?.bedUtilization) {
    const sign = delta.bedUtilization > 0 ? '+' : ''
    parts.push(`bedUtilization ${sign}${delta.bedUtilization}`)
  }
  if (delta?.ambulanceQueue) {
    const sign = delta.ambulanceQueue > 0 ? '+' : ''
    parts.push(`ambulanceQueue ${sign}${delta.ambulanceQueue}`)
  }
  return parts.join(' · ')
}

export function formatPressureWhen(when) {
  const parts = []
  if (when.bedUtilization != null) {
    parts.push(`bedUtilization≥${when.bedUtilization}`)
  }
  if (when.ambulanceQueue != null) {
    parts.push(`ambulanceQueue≥${when.ambulanceQueue}`)
  }
  if (when.bedUtilizationMax != null) {
    parts.push(`bedUtilization≤${when.bedUtilizationMax}`)
  }
  if (when.ambulanceQueueMax != null) {
    parts.push(`ambulanceQueue≤${when.ambulanceQueueMax}`)
  }
  return parts.join(', ')
}

export function readIntro() {
  const content = fs.readFileSync(PATHS.introTs, 'utf8')
  const title = content.match(/export const INTRO_TITLE = '((?:\\'|[^'])*)'/)?.[1]
  const body = content.match(
    /export const INTRO_BODY =\s*\n?\s*'((?:\\'|[^'])*)'/
  )?.[1]
  const cta = content.match(/export const INTRO_CTA = '((?:\\'|[^'])*)'/)?.[1]
  if (!title || !body || !cta) {
    throw new Error('Could not parse intro.ts')
  }
  return {
    title: title.replace(/\\'/g, "'"),
    body: body.replace(/\\'/g, "'"),
    cta: cta.replace(/\\'/g, "'"),
  }
}

export function readCompileLog() {
  const content = fs.readFileSync(PATHS.metricsTs, 'utf8')
  const match = content.match(
    /export const COMPILE_LOG_LINES = \[\n([\s\S]*?)\n\]/
  )
  if (!match) throw new Error('Could not parse COMPILE_LOG_LINES in metrics.ts')
  const lines = [...match[1].matchAll(/'((?:\\'|[^'])*)'/g)].map((m) =>
    m[1].replace(/\\'/g, "'")
  )
  return lines
}

export function toTsSingleQuotedString(value) {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

export function writeIntro(updates) {
  let content = fs.readFileSync(PATHS.introTs, 'utf8')
  if (updates.title != null) {
    content = content.replace(
      /export const INTRO_TITLE = .+/,
      `export const INTRO_TITLE = ${toTsSingleQuotedString(updates.title)}`
    )
  }
  if (updates.body != null) {
    content = content.replace(
      /export const INTRO_BODY =\s*\n?\s*.+/,
      `export const INTRO_BODY =\n  ${toTsSingleQuotedString(updates.body)}`
    )
  }
  if (updates.cta != null) {
    content = content.replace(
      /export const INTRO_CTA = .+/,
      `export const INTRO_CTA = ${toTsSingleQuotedString(updates.cta)}`
    )
  }
  fs.writeFileSync(PATHS.introTs, content)
}

export function writeCompileLog(lines) {
  const content = fs.readFileSync(PATHS.metricsTs, 'utf8')
  const formatted = lines.map((line) => `  ${toTsSingleQuotedString(line)}`).join(',\n')
  const updated = content.replace(
    /export const COMPILE_LOG_LINES = \[\n[\s\S]*?\n\]/,
    `export const COMPILE_LOG_LINES = [\n${formatted},\n]`
  )
  fs.writeFileSync(PATHS.metricsTs, updated)
}

const ANCHOR_RE = /^<!-- @([\w.[\]]+)(?: · .*)? -->$/

export function parseNarrativeMd(content) {
  const lines = content.split('\n')
  const blocks = []
  let i = 0

  while (i < lines.length) {
    const anchorMatch = lines[i].match(ANCHOR_RE)
    if (!anchorMatch) {
      i += 1
      continue
    }

    const anchor = anchorMatch[1]
    i += 1
    const textLines = []

    while (i < lines.length) {
      const line = lines[i]
      if (ANCHOR_RE.test(line)) break
      if (/^#{1,4} /.test(line)) break
      if (/^---$/.test(line)) break
      textLines.push(line)
      i += 1
    }

    while (textLines.length && textLines[textLines.length - 1].trim() === '') {
      textLines.pop()
    }

    blocks.push({ anchor, text: textLines.join('\n') })
  }

  return blocks
}

export function applyAnchor(storyData, anchor, text, introUpdates, compileLogUpdates) {
  if (anchor.startsWith('intro.')) {
    introUpdates[anchor.slice('intro.'.length)] = text
    return
  }

  const compileMatch = anchor.match(/^compile_log\[(\d+)\]$/)
  if (compileMatch) {
    compileLogUpdates[parseInt(compileMatch[1], 10)] = text
    return
  }

  if (anchor.startsWith('epilogue.')) {
    const sub = anchor.slice('epilogue.'.length)
    if (sub === 'logout_command') {
      storyData.epilogue.logout_command = text
      return
    }
    const feedMatch = sub.match(/^feed\[(\d+)\]$/)
    if (feedMatch) {
      storyData.epilogue.feed[parseInt(feedMatch[1], 10)].text = text
      return
    }
    const logoutMatch = sub.match(/^logout_output\[(\d+)\]$/)
    if (logoutMatch) {
      storyData.epilogue.logout_output[parseInt(logoutMatch[1], 10)].text = text
      return
    }
  }

  const chapterMatch = anchor.match(/^([\d]+\.[\d]+)\.(.+)$/)
  if (!chapterMatch) {
    throw new Error(`Unknown anchor: ${anchor}`)
  }

  const [, chapterId, rest] = chapterMatch
  const chapter = storyData.chapters.find((c) => c.id === chapterId)
  if (!chapter) {
    throw new Error(`Chapter not found for anchor: ${anchor}`)
  }

  const initMatch = rest.match(/^(console_init|feed_init|pressure_lines)\[(\d+)\]$/)
  if (initMatch) {
    const [, field, index] = initMatch
    chapter[field][parseInt(index, 10)].text = text
    return
  }

  const optionTextMatch = rest.match(/^options\[(\d+)\]\.text$/)
  if (optionTextMatch) {
    chapter.options[parseInt(optionTextMatch[1], 10)].text = text
    return
  }

  const optionPlayerMatch = rest.match(/^options\[(\d+)\]\.player_message$/)
  if (optionPlayerMatch) {
    chapter.options[parseInt(optionPlayerMatch[1], 10)].player_message = text
    return
  }

  const optionConsoleMatch = rest.match(/^options\[(\d+)\]\.console_response\[(\d+)\]$/)
  if (optionConsoleMatch) {
    chapter.options[parseInt(optionConsoleMatch[1], 10)].console_response[
      parseInt(optionConsoleMatch[2], 10)
    ].text = text
    return
  }

  const optionFeedMatch = rest.match(/^options\[(\d+)\]\.feed_update\[(\d+)\]$/)
  if (optionFeedMatch) {
    chapter.options[parseInt(optionFeedMatch[1], 10)].feed_update[
      parseInt(optionFeedMatch[2], 10)
    ].text = text
    return
  }

  throw new Error(`Unknown chapter path in anchor: ${anchor}`)
}
