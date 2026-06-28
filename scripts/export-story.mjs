import fs from 'fs'
import {
  PATHS,
  anchorLine,
  block,
  formatChoiceMeta,
  formatPressureWhen,
  formatSender,
  readCompileLog,
  readIntro,
  readStoryData,
} from './story-narrative.mjs'

function exportStory() {
  const data = readStoryData()
  const intro = readIntro()
  const compileLog = readCompileLog()
  const lines = []

  lines.push(`# ${data.title}`)
  lines.push('')
  lines.push('> Narrative export for editing. Keep every `<!-- @... -->` line unchanged.')
  lines.push('> Preserve placeholders like `{occupancy}`, `{bedUtilization}`, and `{ambulanceQueue}`.')
  lines.push('> Re-import with: `npm run import:story`')
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('## Intro')
  lines.push('')
  lines.push(block('intro.title', intro.title))
  lines.push(block('intro.body', intro.body))
  lines.push(block('intro.cta', intro.cta))
  lines.push('---')
  lines.push('')

  for (const chapter of data.chapters) {
    lines.push(`## Chapter ${chapter.id} · ${chapter.start_time}`)
    lines.push(
      `**Identity:** ${chapter.identity} · **Channel:** ${chapter.channel}`
    )
    lines.push('')

    lines.push('### Console — on entry')
    lines.push('')
    chapter.console_init.forEach((line, index) => {
      lines.push(block(`${chapter.id}.console_init[${index}]`, line.text))
    })

    lines.push('### Feed — on entry')
    lines.push('')
    chapter.feed_init.forEach((item, index) => {
      const meta = `${formatSender(item.sender)} · +${item.tick_offset_mins}m`
      lines.push(block(`${chapter.id}.feed_init[${index}]`, item.text, meta))
    })

    if (chapter.pressure_lines?.length) {
      lines.push('### Pressure (conditional)')
      lines.push('')
      chapter.pressure_lines.forEach((item, index) => {
        const meta = `${formatSender(item.sender)} · when ${formatPressureWhen(item.when)}`
        lines.push(block(`${chapter.id}.pressure_lines[${index}]`, item.text, meta))
      })
    }

    chapter.options.forEach((option, optionIndex) => {
      const choiceLabel = String.fromCharCode(65 + optionIndex)
      lines.push('---')
      lines.push('')
      lines.push(`### Choice ${choiceLabel} — ${option.text}`)
      lines.push(`*(${formatChoiceMeta(option)})*`)
      lines.push('')
      lines.push(block(`${chapter.id}.options[${optionIndex}].text`, option.text))

      if (option.player_message) {
        lines.push(
          block(
            `${chapter.id}.options[${optionIndex}].player_message`,
            option.player_message
          )
        )
      }

      lines.push('#### Console response')
      lines.push('')
      option.console_response.forEach((line, index) => {
        lines.push(
          block(`${chapter.id}.options[${optionIndex}].console_response[${index}]`, line.text)
        )
      })

      lines.push('#### Feed after choice')
      lines.push('')
      option.feed_update.forEach((item, index) => {
        const meta = `${formatSender(item.sender)} · +${item.tick_offset_mins}m`
        lines.push(
          block(`${chapter.id}.options[${optionIndex}].feed_update[${index}]`, item.text, meta)
        )
      })
    })

    lines.push('---')
    lines.push('')
  }

  lines.push('## Epilogue')
  lines.push('')
  lines.push('### Feed')
  lines.push('')
  data.epilogue.feed.forEach((item, index) => {
    const meta = `${formatSender(item.sender)} · +${item.tick_offset_mins}m`
    lines.push(block(`epilogue.feed[${index}]`, item.text, meta))
  })

  lines.push('### Console — logout')
  lines.push('')
  lines.push(block('epilogue.logout_command', data.epilogue.logout_command))
  data.epilogue.logout_output.forEach((line, index) => {
    lines.push(block(`epilogue.logout_output[${index}]`, line.text))
  })

  lines.push('---')
  lines.push('')
  lines.push('## System reset compile log')
  lines.push('')
  compileLog.forEach((line, index) => {
    lines.push(block(`compile_log[${index}]`, line))
  })

  const output = `${lines.join('\n').trimEnd()}\n`
  fs.writeFileSync(PATHS.narrativeMd, output)

  const anchorCount = (output.match(/^<!-- @/gm) ?? []).length
  console.log(`Exported ${anchorCount} text blocks to ${PATHS.narrativeMd}`)
}

exportStory()
