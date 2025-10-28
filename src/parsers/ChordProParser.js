// ChordPro parser adapted from DongleControl
// Parses ChordPro format files into the standard song data structure

/**
 * Parse ChordPro format text into song data
 * @param {string} data - ChordPro formatted text
 * @param {string} filename - Optional filename for default title
 * @returns {Object} Parsed song object
 */
export function parseChordPro(data, filename = 'Untitled') {
  const lines = data.split('\n')
  const sections = []
  let currentSection = null
  let title = filename
  let artist = ''
  let key = ''
  let tempo = 80
  let timeSignature = '4/4'
  let ccli = ''

  lines.forEach(line => {
    line = line.trim()
    if (!line) return

    // Parse ChordPro directives
    if (line.startsWith('{title:') || line.startsWith('{t:')) {
      title = line.match(/\{(?:title|t):\s*([^}]+)\}/)?.[1] || title
    } else if (line.startsWith('{artist:') || line.startsWith('{a:')) {
      artist = line.match(/\{(?:artist|a):\s*([^}]+)\}/)?.[1] || ''
    } else if (line.startsWith('{key:') || line.startsWith('{k:')) {
      key = line.match(/\{(?:key|k):\s*([^}]+)\}/)?.[1] || ''
    } else if (line.startsWith('{tempo:')) {
      const tempoMatch = line.match(/\{tempo:\s*(\d+)\}/)?.[1]
      if (tempoMatch) tempo = parseInt(tempoMatch, 10)
    } else if (line.startsWith('{time:')) {
      timeSignature = line.match(/\{time:\s*([^}]+)\}/)?.[1] || '4/4'
    } else if (line.startsWith('{ccli:')) {
      ccli = line.match(/\{ccli:\s*([^}]+)\}/)?.[1] || ''
    } else if (line.startsWith('{start_of_') || line.startsWith('{soc')) {
      const sectionName = line.match(/\{start_of_(\w+)(?::\s*([^}]+))?\}/)?.[2] ||
        line.match(/\{start_of_(\w+)\}/)?.[1] || 'Section'
      currentSection = {
        title: sectionName.charAt(0).toUpperCase() + sectionName.slice(1),
        lines: []
      }
    } else if (line.startsWith('{end_of_') || line.startsWith('{eoc')) {
      if (currentSection) {
        sections.push(currentSection)
        currentSection = null
      }
    } else if (!line.startsWith('{')) {
      // Regular lyric/chord line
      if (!currentSection) {
        currentSection = { title: 'Verse', lines: [] }
      }

      const parsedLine = parseChordProLine(line)
      if (parsedLine.length > 0) {
        currentSection.lines.push(parsedLine)
      }
    }
  })

  // Add final section if exists
  if (currentSection) {
    sections.push(currentSection)
  }

  return {
    id: Date.now().toString(),
    title,
    artist,
    key: key || 'C',
    tempo,
    timeSignature,
    ccli,
    sections,
    arrangement: sections.map(s => ({ title: s.title }))
  }
}

/**
 * Parse a ChordPro line into [chord, lyric] pairs
 * Format: "You're [C]rich in[G] love" -> [['', "You're "], ['C', 'rich '], ['G', 'love']]
 */
export function parseChordProLine(line) {
  const result = []
  let currentChord = ''
  let currentLyric = ''
  let i = 0

  while (i < line.length) {
    if (line[i] === '[') {
      // Found start of chord
      if (currentLyric || currentChord) {
        result.push([currentChord, currentLyric])
        currentChord = ''
        currentLyric = ''
      }

      const chordEnd = line.indexOf(']', i)
      if (chordEnd !== -1) {
        currentChord = line.substring(i + 1, chordEnd)
        i = chordEnd + 1
      } else {
        i++
      }
    } else {
      currentLyric += line[i]
      i++
    }
  }

  // Add final chord/lyric pair
  if (currentLyric || currentChord) {
    result.push([currentChord, currentLyric])
  }

  return result
}
