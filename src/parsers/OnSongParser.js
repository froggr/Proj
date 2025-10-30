// OnSong parser - converts OnSong format to song data
// OnSong format is similar to ChordPro but with different metadata syntax

/**
 * Parse OnSong format text into song data
 * @param {string} data - OnSong formatted text
 * @param {string} filename - Optional filename for default title
 * @returns {Object} Parsed song object
 */
export function parseOnSong(data, filename = 'Untitled') {
  const lines = data.split('\n')
  const sections = []
  let currentSection = null

  // Metadata
  let title = filename
  let artist = ''
  let key = ''
  let tempo = 80
  let timeSignature = '4/4'
  let ccli = ''

  // Track whether we're in metadata section (first lines before blank line)
  let inMetadata = true

  lines.forEach(line => {
    const trimmed = line.trim()

    // Empty line signals end of metadata section
    if (!trimmed && inMetadata) {
      inMetadata = false
      return
    }

    if (!trimmed) return

    // Parse OnSong metadata (Key: Value format)
    if (inMetadata) {
      if (trimmed.startsWith('Title:')) {
        title = trimmed.substring(6).trim()
      } else if (trimmed.startsWith('Artist:')) {
        artist = trimmed.substring(7).trim()
      } else if (trimmed.startsWith('Key:')) {
        key = trimmed.substring(4).trim()
      } else if (trimmed.startsWith('Tempo:')) {
        const tempoMatch = trimmed.substring(6).trim()
        tempo = parseInt(tempoMatch, 10) || 80
      } else if (trimmed.startsWith('Time:')) {
        timeSignature = trimmed.substring(5).trim()
      } else if (trimmed.startsWith('CCLI:')) {
        ccli = trimmed.substring(5).trim()
      }
      return
    }

    // OnSong section headers: plain text ending with colon (e.g., "Verse 1:", "Chorus:", "Bridge:")
    // Check if line is a section header (ends with : and has no chord markers)
    if (trimmed.endsWith(':') && !trimmed.includes('[')) {
      // Save previous section
      if (currentSection && currentSection.lines.length > 0) {
        sections.push(currentSection)
      }

      // Create new section
      const sectionName = trimmed.slice(0, -1).trim() // Remove the trailing colon
      currentSection = {
        title: sectionName,
        lines: []
      }
      return
    }

    // Alternative: ChordPro-style section headers: {c: Section Name} or {comment: Section Name}
    if (trimmed.startsWith('{c:') || trimmed.startsWith('{comment:')) {
      // Save previous section
      if (currentSection && currentSection.lines.length > 0) {
        sections.push(currentSection)
      }

      const sectionName = trimmed.match(/\{(?:c|comment):\s*([^}]+)\}/)?.[1] || 'Section'
      currentSection = {
        title: sectionName.trim(),
        lines: []
      }
      return
    }

    // Regular lyric/chord line
    if (!currentSection) {
      currentSection = { title: 'Verse', lines: [] }
    }

    const parsedLine = parseOnSongLine(trimmed)
    if (parsedLine.length > 0) {
      currentSection.lines.push(parsedLine)
    }
  })

  // Add final section
  if (currentSection && currentSection.lines.length > 0) {
    sections.push(currentSection)
  }

  // Generate processed_sections for DongleControl-compatible rendering
  const processed_sections = sections.map(section => ({
    title: section.title,
    lines: section.lines || []
  }))

  // Add blank intro and outro sections for background control
  processed_sections.unshift({
    title: 'Intro',
    lines: [] // Empty lines = blank slide (background only)
  })

  processed_sections.push({
    title: 'Outro',
    lines: [] // Empty lines = blank slide (background only)
  })

  return {
    id: Date.now().toString(),
    title,
    artist,
    key: key || 'C',
    current_key: key || 'C',
    tempo,
    time_signature: timeSignature,
    ccli,
    nashville: 0,
    sections,
    processed_sections,
    arrangement: sections.map(s => ({ title: s.title })),
    _renderKey: Date.now()
  }
}

/**
 * Parse an OnSong line into [chord, lyric] pairs
 * OnSong uses same chord notation as ChordPro: [C]lyric
 */
export function parseOnSongLine(line) {
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
