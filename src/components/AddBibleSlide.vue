<template>
  <Modal :show="show" title="Add Bible Verse" @close="$emit('close')">
    <div class="space-y-4">
      <!-- Mode Toggle -->
      <div class="flex gap-2 p-1 bg-gray-800 rounded-lg">
        <button
          @click="mode = 'api'"
          :class="[
            'flex-1 px-4 py-2 rounded-md font-medium text-sm transition-colors',
            mode === 'api'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white'
          ]"
        >
          Fetch from API
        </button>
        <button
          @click="mode = 'manual'"
          :class="[
            'flex-1 px-4 py-2 rounded-md font-medium text-sm transition-colors',
            mode === 'manual'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white'
          ]"
        >
          Manual Entry
        </button>
      </div>

      <!-- API Mode -->
      <div v-if="mode === 'api'" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            API.Bible Key (optional)
          </label>
          <input
            v-model="apiKey"
            type="password"
            placeholder="Enter your API.Bible key for modern translations"
            class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p class="mt-1 text-xs text-gray-400">
            Get free key at <a href="https://scripture.api.bible" target="_blank" class="text-blue-400 hover:underline">scripture.api.bible</a> (500 requests/day free)
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Translation
          </label>
          <select
            v-model="translation"
            class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <optgroup label="Modern Translations (API.Bible)">
              <option value="de4e12af7f28f599-02">NIV (New International)</option>
              <option value="06125adad2d5898a-01">NLT (New Living Translation)</option>
              <option value="65eec8e0b60e656b-01">AMP (Amplified Bible)</option>
              <option value="f421fe261da7624f-01">ESV (English Standard)</option>
              <option value="9879dbb7cfe39e4d-04">NLT (New Living - UK)</option>
            </optgroup>
            <optgroup label="Traditional Translations (API.Bible)">
              <option value="de4e12af7f28f599-01">KJV (King James)</option>
              <option value="de4e12af7f28f599-03">NKJV (New King James)</option>
            </optgroup>
            <optgroup label="Free Translations (bible-api.com)">
              <option value="kjv">KJV (King James) - Free</option>
              <option value="web">WEB (World English) - Free</option>
              <option value="bbe">BBE (Basic English) - Free</option>
            </optgroup>
          </select>
        </div>

        <div>
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="showVerseNumbers"
              type="checkbox"
              class="w-4 h-4 bg-gray-700 border-gray-600 rounded text-blue-600 focus:ring-blue-500 focus:ring-2"
            />
            <span class="text-sm text-gray-300">Show verse numbers in text</span>
          </label>
        </div>

        <!-- Quick Entry Mode -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Quick Entry
          </label>
          <input
            v-model="quickEntry"
            @input="parseQuickEntry"
            type="text"
            placeholder="e.g., john3:16, mat 10:2-4, 1cor13:4-7"
            class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
          <p class="mt-1 text-xs text-gray-400">
            Type book chapter:verse (flexible format: "john3:16" or "mat 10 : 2-4")
          </p>
          <div v-if="parsedReference" class="mt-2 p-2 bg-green-900/30 border border-green-700 rounded text-green-300 text-sm">
            ✓ Parsed: {{ parsedReference }}
          </div>
        </div>

        <!-- OR separator -->
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-600"></div>
          </div>
          <div class="relative flex justify-center text-xs">
            <span class="px-2 bg-gray-800 text-gray-400">or use dropdowns</span>
          </div>
        </div>

        <!-- Dropdown Mode -->
        <div class="grid grid-cols-3 gap-2">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Book
            </label>
            <select
              v-model="book"
              @change="onBookChange"
              class="w-full px-2 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select...</option>
              <optgroup v-for="(books, testament) in bibleBooks" :key="testament" :label="testament">
                <option v-for="bookInfo in books" :key="bookInfo.name" :value="bookInfo.name">
                  {{ bookInfo.name }}
                </option>
              </optgroup>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Chapter
            </label>
            <select
              v-model.number="chapter"
              @change="onChapterChange"
              :disabled="!book"
              class="w-full px-2 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">Ch</option>
              <option v-for="ch in availableChapters" :key="ch" :value="ch">{{ ch }}</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Verses
            </label>
            <div class="flex gap-1">
              <select
                v-model.number="verseFrom"
                :disabled="!chapter"
                class="w-full px-1 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">From</option>
                <option v-for="v in availableVerses" :key="v" :value="v">{{ v }}</option>
              </select>
              <select
                v-model.number="verseTo"
                :disabled="!verseFrom"
                class="w-full px-1 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">To</option>
                <option v-for="v in availableVerses" :key="v" :value="v">{{ v }}</option>
              </select>
            </div>
          </div>
        </div>

        <button
          @click="fetchVerse"
          :disabled="!book || !chapter || !verseFrom || loading"
          class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-colors"
        >
          {{ loading ? 'Fetching...' : 'Fetch Scripture' }}
        </button>

        <div v-if="error" class="p-4 bg-red-900 bg-opacity-30 border border-red-700 rounded-lg">
          <p class="text-red-300">{{ error }}</p>
        </div>

        <div v-if="text && !loading" class="space-y-2">
          <label class="block text-sm font-medium text-gray-300">
            Fetched Scripture
          </label>
          <div class="p-4 bg-gray-700 border border-gray-600 rounded-lg">
            <p class="text-sm font-semibold text-gray-300 mb-2">{{ reference }}</p>
            <p class="text-white">{{ text }}</p>
          </div>
        </div>
      </div>

      <!-- Manual Mode -->
      <div v-if="mode === 'manual'" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Reference
          </label>
          <input
            v-model="reference"
            type="text"
            placeholder="e.g., John 3:16-17"
            class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Translation
          </label>
          <select
            v-model="translation"
            class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="NIV">NIV</option>
            <option value="ESV">ESV</option>
            <option value="KJV">KJV</option>
            <option value="NKJV">NKJV</option>
            <option value="NLT">NLT</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Verse Text
          </label>
          <textarea
            v-model="text"
            rows="6"
            placeholder="Paste the verse text here..."
            class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Lines Per Slide
          </label>
          <input
            v-model.number="linesPerSlide"
            type="number"
            min="1"
            max="10"
            class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Background Color
          </label>
          <input
            v-model="background"
            type="color"
            class="w-full h-[42px] bg-gray-700 border border-gray-600 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      <div class="flex gap-3 justify-end pt-4">
        <button
          @click="$emit('close')"
          class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold text-white transition-colors"
        >
          Cancel
        </button>
        <button
          @click="addSlide"
          :disabled="!reference || !text"
          class="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-colors"
        >
          Add Slide
        </button>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import Modal from './Modal.vue'

const emit = defineEmits(['close', 'add'])

defineProps({
  show: Boolean
})

// Mode toggle
const mode = ref('api')

// API mode fields
const apiKey = ref('')

// Load API key from localStorage on mount
onMounted(() => {
  const savedKey = localStorage.getItem('bible-api-key')
  if (savedKey) {
    apiKey.value = savedKey
  }
})

// Save API key to localStorage when it changes
watch(apiKey, (newKey) => {
  if (newKey) {
    localStorage.setItem('bible-api-key', newKey)
  } else {
    localStorage.removeItem('bible-api-key')
  }
})
const book = ref('')
const chapter = ref(null)
const verseFrom = ref(null)
const verseTo = ref(null)
const loading = ref(false)
const error = ref('')
const quickEntry = ref('')
const parsedReference = ref('')
const showVerseNumbers = ref(true) // Default to showing verse numbers

// Shared fields
const reference = ref('')
const translation = ref('06125adad2d5898a-01') // Default to NLT
const text = ref('')
const linesPerSlide = ref(3)
const background = ref('#1a1a1a')

// Translation name mapping for display
const translationNames = {
  'de4e12af7f28f599-02': 'NIV',
  '06125adad2d5898a-01': 'NLT',
  '65eec8e0b60e656b-01': 'AMP',
  'f421fe261da7624f-01': 'ESV',
  '9879dbb7cfe39e4d-04': 'NLT',
  'de4e12af7f28f599-01': 'KJV',
  'de4e12af7f28f599-03': 'NKJV',
  'kjv': 'KJV',
  'web': 'WEB',
  'bbe': 'BBE'
}

// Book name to API.Bible book ID mapping (abbreviated list)
const bookMapping = {
  'genesis': 'GEN', 'gen': 'GEN',
  'exodus': 'EXO', 'exo': 'EXO',
  'leviticus': 'LEV', 'lev': 'LEV',
  'numbers': 'NUM', 'num': 'NUM',
  'deuteronomy': 'DEU', 'deu': 'DEU', 'deut': 'DEU',
  'joshua': 'JOS', 'jos': 'JOS', 'josh': 'JOS',
  'judges': 'JDG', 'jdg': 'JDG', 'judg': 'JDG',
  'ruth': 'RUT', 'rut': 'RUT',
  '1 samuel': '1SA', '1sa': '1SA', '1sam': '1SA',
  '2 samuel': '2SA', '2sa': '2SA', '2sam': '2SA',
  '1 kings': '1KI', '1ki': '1KI',
  '2 kings': '2KI', '2ki': '2KI',
  '1 chronicles': '1CH', '1ch': '1CH', '1chron': '1CH',
  '2 chronicles': '2CH', '2ch': '2CH', '2chron': '2CH',
  'ezra': 'EZR', 'ezr': 'EZR',
  'nehemiah': 'NEH', 'neh': 'NEH',
  'esther': 'EST', 'est': 'EST',
  'job': 'JOB',
  'psalm': 'PSA', 'psalms': 'PSA', 'psa': 'PSA', 'ps': 'PSA',
  'proverbs': 'PRO', 'pro': 'PRO', 'prov': 'PRO',
  'ecclesiastes': 'ECC', 'ecc': 'ECC', 'eccl': 'ECC',
  'song of solomon': 'SNG', 'sng': 'SNG', 'song': 'SNG',
  'isaiah': 'ISA', 'isa': 'ISA',
  'jeremiah': 'JER', 'jer': 'JER',
  'lamentations': 'LAM', 'lam': 'LAM',
  'ezekiel': 'EZK', 'ezk': 'EZK', 'ezek': 'EZK',
  'daniel': 'DAN', 'dan': 'DAN',
  'hosea': 'HOS', 'hos': 'HOS',
  'joel': 'JOL', 'jol': 'JOL',
  'amos': 'AMO', 'amo': 'AMO',
  'obadiah': 'OBA', 'oba': 'OBA', 'obad': 'OBA',
  'jonah': 'JON', 'jon': 'JON',
  'micah': 'MIC', 'mic': 'MIC',
  'nahum': 'NAM', 'nam': 'NAM', 'nah': 'NAM',
  'habakkuk': 'HAB', 'hab': 'HAB',
  'zephaniah': 'ZEP', 'zep': 'ZEP', 'zeph': 'ZEP',
  'haggai': 'HAG', 'hag': 'HAG',
  'zechariah': 'ZEC', 'zec': 'ZEC', 'zech': 'ZEC',
  'malachi': 'MAL', 'mal': 'MAL',
  'matthew': 'MAT', 'mat': 'MAT', 'matt': 'MAT',
  'mark': 'MRK', 'mrk': 'MRK',
  'luke': 'LUK', 'luk': 'LUK',
  'john': 'JHN', 'jhn': 'JHN',
  'acts': 'ACT', 'act': 'ACT',
  'romans': 'ROM', 'rom': 'ROM',
  '1 corinthians': '1CO', '1co': '1CO', '1cor': '1CO',
  '2 corinthians': '2CO', '2co': '2CO', '2cor': '2CO',
  'galatians': 'GAL', 'gal': 'GAL',
  'ephesians': 'EPH', 'eph': 'EPH',
  'philippians': 'PHP', 'php': 'PHP', 'phil': 'PHP',
  'colossians': 'COL', 'col': 'COL',
  '1 thessalonians': '1TH', '1th': '1TH', '1thess': '1TH',
  '2 thessalonians': '2TH', '2th': '2TH', '2thess': '2TH',
  '1 timothy': '1TI', '1ti': '1TI', '1tim': '1TI',
  '2 timothy': '2TI', '2ti': '2TI', '2tim': '2TI',
  'titus': 'TIT', 'tit': 'TIT',
  'philemon': 'PHM', 'phm': 'PHM', 'phlm': 'PHM',
  'hebrews': 'HEB', 'heb': 'HEB',
  'james': 'JAS', 'jas': 'JAS', 'jas': 'JAS',
  '1 peter': '1PE', '1pe': '1PE', '1pet': '1PE',
  '2 peter': '2PE', '2pe': '2PE', '2pet': '2PE',
  '1 john': '1JN', '1jn': '1JN',
  '2 john': '2JN', '2jn': '2JN',
  '3 john': '3JN', '3jn': '3JN',
  'jude': 'JUD', 'jud': 'JUD',
  'revelation': 'REV', 'rev': 'REV'
}

// Bible book database with chapter counts
const bibleBooks = {
  'Old Testament': [
    { name: 'Genesis', abbr: ['gen', 'ge', 'gn'], chapters: 50 },
    { name: 'Exodus', abbr: ['exo', 'ex', 'exod'], chapters: 40 },
    { name: 'Leviticus', abbr: ['lev', 'le', 'lv'], chapters: 27 },
    { name: 'Numbers', abbr: ['num', 'nu', 'nm', 'nb'], chapters: 36 },
    { name: 'Deuteronomy', abbr: ['deu', 'dt', 'deut'], chapters: 34 },
    { name: 'Joshua', abbr: ['jos', 'josh'], chapters: 24 },
    { name: 'Judges', abbr: ['jdg', 'judg', 'jg'], chapters: 21 },
    { name: 'Ruth', abbr: ['rut', 'ru', 'rth'], chapters: 4 },
    { name: '1 Samuel', abbr: ['1sa', '1sam', '1sm', '1s'], chapters: 31 },
    { name: '2 Samuel', abbr: ['2sa', '2sam', '2sm', '2s'], chapters: 24 },
    { name: '1 Kings', abbr: ['1ki', '1kgs', '1k'], chapters: 22 },
    { name: '2 Kings', abbr: ['2ki', '2kgs', '2k'], chapters: 25 },
    { name: '1 Chronicles', abbr: ['1ch', '1chr', '1chron'], chapters: 29 },
    { name: '2 Chronicles', abbr: ['2ch', '2chr', '2chron'], chapters: 36 },
    { name: 'Ezra', abbr: ['ezr', 'ez'], chapters: 10 },
    { name: 'Nehemiah', abbr: ['neh', 'ne'], chapters: 13 },
    { name: 'Esther', abbr: ['est', 'esth'], chapters: 10 },
    { name: 'Job', abbr: ['job', 'jb'], chapters: 42 },
    { name: 'Psalms', abbr: ['psa', 'ps', 'psalm', 'pss'], chapters: 150 },
    { name: 'Proverbs', abbr: ['pro', 'pr', 'prv', 'prov'], chapters: 31 },
    { name: 'Ecclesiastes', abbr: ['ecc', 'ec', 'eccl'], chapters: 12 },
    { name: 'Song of Solomon', abbr: ['sng', 'ss', 'song', 'sos'], chapters: 8 },
    { name: 'Isaiah', abbr: ['isa', 'is'], chapters: 66 },
    { name: 'Jeremiah', abbr: ['jer', 'je', 'jr'], chapters: 52 },
    { name: 'Lamentations', abbr: ['lam', 'la'], chapters: 5 },
    { name: 'Ezekiel', abbr: ['ezk', 'eze', 'ezek'], chapters: 48 },
    { name: 'Daniel', abbr: ['dan', 'da', 'dn'], chapters: 12 },
    { name: 'Hosea', abbr: ['hos', 'ho'], chapters: 14 },
    { name: 'Joel', abbr: ['jol', 'joe', 'jl'], chapters: 3 },
    { name: 'Amos', abbr: ['amo', 'am'], chapters: 9 },
    { name: 'Obadiah', abbr: ['oba', 'ob', 'obad'], chapters: 1 },
    { name: 'Jonah', abbr: ['jon', 'jnh'], chapters: 4 },
    { name: 'Micah', abbr: ['mic', 'mc'], chapters: 7 },
    { name: 'Nahum', abbr: ['nam', 'na', 'nah'], chapters: 3 },
    { name: 'Habakkuk', abbr: ['hab', 'hb'], chapters: 3 },
    { name: 'Zephaniah', abbr: ['zep', 'zp', 'zeph'], chapters: 3 },
    { name: 'Haggai', abbr: ['hag', 'hg'], chapters: 2 },
    { name: 'Zechariah', abbr: ['zec', 'zc', 'zech'], chapters: 14 },
    { name: 'Malachi', abbr: ['mal', 'ml'], chapters: 4 }
  ],
  'New Testament': [
    { name: 'Matthew', abbr: ['mat', 'mt', 'matt'], chapters: 28 },
    { name: 'Mark', abbr: ['mrk', 'mk', 'mar'], chapters: 16 },
    { name: 'Luke', abbr: ['luk', 'lk'], chapters: 24 },
    { name: 'John', abbr: ['jhn', 'jn', 'joh'], chapters: 21 },
    { name: 'Acts', abbr: ['act', 'ac'], chapters: 28 },
    { name: 'Romans', abbr: ['rom', 'ro', 'rm'], chapters: 16 },
    { name: '1 Corinthians', abbr: ['1co', '1cor', '1c'], chapters: 16 },
    { name: '2 Corinthians', abbr: ['2co', '2cor', '2c'], chapters: 13 },
    { name: 'Galatians', abbr: ['gal', 'ga'], chapters: 6 },
    { name: 'Ephesians', abbr: ['eph', 'ep'], chapters: 6 },
    { name: 'Philippians', abbr: ['php', 'phil', 'pp'], chapters: 4 },
    { name: 'Colossians', abbr: ['col', 'co'], chapters: 4 },
    { name: '1 Thessalonians', abbr: ['1th', '1thess', '1thes'], chapters: 5 },
    { name: '2 Thessalonians', abbr: ['2th', '2thess', '2thes'], chapters: 3 },
    { name: '1 Timothy', abbr: ['1ti', '1tim', '1tm'], chapters: 6 },
    { name: '2 Timothy', abbr: ['2ti', '2tim', '2tm'], chapters: 4 },
    { name: 'Titus', abbr: ['tit', 'ti'], chapters: 3 },
    { name: 'Philemon', abbr: ['phm', 'phlm', 'pm'], chapters: 1 },
    { name: 'Hebrews', abbr: ['heb', 'he'], chapters: 13 },
    { name: 'James', abbr: ['jas', 'jm', 'jam'], chapters: 5 },
    { name: '1 Peter', abbr: ['1pe', '1pet', '1pt', '1p'], chapters: 5 },
    { name: '2 Peter', abbr: ['2pe', '2pet', '2pt', '2p'], chapters: 3 },
    { name: '1 John', abbr: ['1jn', '1joh', '1j'], chapters: 5 },
    { name: '2 John', abbr: ['2jn', '2joh', '2j'], chapters: 1 },
    { name: '3 John', abbr: ['3jn', '3joh', '3j'], chapters: 1 },
    { name: 'Jude', abbr: ['jud', 'jd'], chapters: 1 },
    { name: 'Revelation', abbr: ['rev', 're', 'rv'], chapters: 22 }
  ]
}

// Helper function to find book info from name or abbreviation
function findBookInfo(searchTerm) {
  const search = searchTerm.toLowerCase().trim()

  for (const testament in bibleBooks) {
    for (const bookInfo of bibleBooks[testament]) {
      // Check full name
      if (bookInfo.name.toLowerCase() === search) {
        return bookInfo
      }
      // Check abbreviations
      if (bookInfo.abbr.includes(search)) {
        return bookInfo
      }
    }
  }
  return null
}

// Parse quick entry text (e.g., "john3:16", "mat 10:2-4", "1cor13:4-7")
function parseQuickEntry() {
  const input = quickEntry.value.trim()
  if (!input) {
    parsedReference.value = ''
    return
  }

  // Flexible regex: capture book name/number, chapter, and verse range
  // Handles: "john3:16", "1cor 13:4-7", "mat 10 : 2-4", "matthew 5:3"
  const regex = /^([1-3]?\s*[a-z]+)\s*(\d+)\s*[:\s]+\s*(\d+)(?:\s*[-–]\s*(\d+))?$/i
  const match = input.match(regex)

  if (!match) {
    parsedReference.value = ''
    return
  }

  const bookSearch = match[1].trim()
  const chapterNum = parseInt(match[2])
  const verseFromNum = parseInt(match[3])
  const verseToNum = match[4] ? parseInt(match[4]) : verseFromNum

  // Find book info
  const bookInfo = findBookInfo(bookSearch)
  if (!bookInfo) {
    parsedReference.value = ''
    return
  }

  // Validate chapter
  if (chapterNum < 1 || chapterNum > bookInfo.chapters) {
    parsedReference.value = ''
    return
  }

  // Set the fields
  book.value = bookInfo.name
  chapter.value = chapterNum
  verseFrom.value = verseFromNum
  verseTo.value = verseToNum

  // Display parsed result
  const verseRange = verseToNum && verseToNum !== verseFromNum
    ? `${verseFromNum}-${verseToNum}`
    : `${verseFromNum}`
  parsedReference.value = `${bookInfo.name} ${chapterNum}:${verseRange}`
}

// Computed properties for cascading dropdowns
const availableChapters = computed(() => {
  if (!book.value) return []

  const bookInfo = findBookInfo(book.value)
  if (!bookInfo) return []

  return Array.from({ length: bookInfo.chapters }, (_, i) => i + 1)
})

const availableVerses = computed(() => {
  // Default to 176 (longest chapter is Psalm 119)
  // In a real app, you'd fetch exact verse counts per chapter
  return Array.from({ length: 176 }, (_, i) => i + 1)
})

// Handlers for dropdown changes
function onBookChange() {
  // Reset chapter and verses when book changes
  chapter.value = null
  verseFrom.value = null
  verseTo.value = null
}

function onChapterChange() {
  // Reset verses when chapter changes
  verseFrom.value = null
  verseTo.value = null
}

async function fetchVerse() {
  loading.value = true
  error.value = ''
  text.value = ''

  try {
    const verseRange = verseTo.value && verseTo.value !== verseFrom.value
      ? `${verseFrom.value}-${verseTo.value}`
      : `${verseFrom.value}`

    // Check if using API.Bible (longer IDs) or bible-api.com (short codes)
    const useApiBible = translation.value.includes('-')

    if (useApiBible) {
      // API.Bible requires API key
      if (!apiKey.value) {
        throw new Error('API.Bible requires an API key. Please enter your key or use a free translation.')
      }

      // Get book abbreviation
      const bookLower = book.value.toLowerCase().trim()
      const bookAbbr = bookMapping[bookLower]

      if (!bookAbbr) {
        throw new Error(`Book "${book.value}" not recognized. Try abbreviations like "John", "Gen", "Rom", etc.`)
      }

      // Build verse ID for API.Bible: BOOK.CHAPTER.VERSE
      const verseId = verseTo.value && verseTo.value !== verseFrom.value
        ? `${bookAbbr}.${chapter.value}.${verseFrom.value}-${bookAbbr}.${chapter.value}.${verseTo.value}`
        : `${bookAbbr}.${chapter.value}.${verseFrom.value}`

      const includeVerseNumbers = showVerseNumbers.value ? 'true' : 'false'
      const url = `https://api.scripture.api.bible/v1/bibles/${translation.value}/passages/${verseId}?content-type=text&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=${includeVerseNumbers}&include-verse-spans=false`

      console.log('Fetching from API.Bible:', url)

      const response = await fetch(url, {
        headers: {
          'api-key': apiKey.value
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your API.Bible key.')
        }
        throw new Error(`API error: ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.data || !data.data.content) {
        throw new Error('No scripture text returned from API')
      }

      // Extract text and reference
      reference.value = data.data.reference || `${book.value} ${chapter.value}:${verseRange}`
      text.value = data.data.content.trim()

      // Clean up extra whitespace
      text.value = text.value.replace(/\s+/g, ' ').trim()

    } else {
      // Use bible-api.com (free, no key required)
      const verseReference = `${book.value} ${chapter.value}:${verseRange}`
      const url = `https://bible-api.com/${encodeURIComponent(verseReference)}?translation=${translation.value}`

      console.log('Fetching from bible-api.com:', url)

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Failed to fetch verse: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // Extract the text and reference
      reference.value = data.reference || verseReference
      text.value = data.text.trim()

      // Strip verse numbers if user doesn't want them
      if (!showVerseNumbers.value) {
        text.value = text.value.replace(/^\d+\s*/gm, '')
      }
    }

    console.log('Successfully fetched:', reference.value)
  } catch (err) {
    console.error('Failed to fetch verse:', err)
    error.value = err.message || 'Failed to fetch scripture. Please check your input and try again.'
  } finally {
    loading.value = false
  }
}

function addSlide() {
  // Get display translation name
  const displayTranslation = translationNames[translation.value] || translation.value.toUpperCase()

  // Estimate characters per line for 4.2vh text (fluid) in 80vw max-width container
  // At 16:9 aspect ratio with typical proportional font, ~55-60 chars per line
  const CHARS_PER_LINE = 58
  const maxCharsPerSlide = CHARS_PER_LINE * linesPerSlide.value

  // Split text into words to avoid breaking mid-word
  const words = text.value.split(/\s+/)
  const slides = []
  let currentSlide = []
  let currentLength = 0

  for (const word of words) {
    const wordLength = word.length + 1 // +1 for space

    // If adding this word would exceed limit, start new slide
    if (currentLength > 0 && currentLength + wordLength > maxCharsPerSlide) {
      slides.push(currentSlide.join(' '))
      currentSlide = [word]
      currentLength = wordLength
    } else {
      currentSlide.push(word)
      currentLength += wordLength
    }
  }

  // Add final slide if there's remaining text
  if (currentSlide.length > 0) {
    slides.push(currentSlide.join(' '))
  }

  // Emit all slides
  if (slides.length > 1) {
    slides.forEach((slideText, index) => {
      emit('add', {
        type: 'bible',
        reference: reference.value,
        text: slideText,
        translation: displayTranslation,
        linesPerSlide: linesPerSlide.value,
        font: 'Inter',
        background: background.value,
        title: `${reference.value} (${index + 1}/${slides.length})`
      })
    })
  } else if (slides.length === 1) {
    emit('add', {
      type: 'bible',
      reference: reference.value,
      text: slides[0],
      translation: displayTranslation,
      linesPerSlide: linesPerSlide.value,
      font: 'Inter',
      background: background.value,
      title: reference.value
    })
  }

  // Reset
  reference.value = ''
  text.value = ''
  book.value = ''
  chapter.value = null
  verseFrom.value = null
  verseTo.value = null
  error.value = ''
  quickEntry.value = ''
  parsedReference.value = ''
  showVerseNumbers.value = true
  translation.value = mode.value === 'api' ? '06125adad2d5898a-01' : 'NIV'
  linesPerSlide.value = 3
  background.value = '#1a1a1a'
}
</script>
