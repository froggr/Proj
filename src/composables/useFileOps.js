import { save, open } from '@tauri-apps/plugin-dialog'
import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs'

export function useFileOps() {
  async function saveToFile(content, defaultName = 'presentation.json') {
    try {
      const filePath = await save({
        defaultPath: defaultName,
        filters: [{
          name: 'JSON',
          extensions: ['json']
        }]
      })

      if (filePath) {
        await writeTextFile(filePath, content)
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to save file:', error)
      return false
    }
  }

  async function loadFromFile() {
    try {
      const filePath = await open({
        multiple: false,
        filters: [{
          name: 'JSON',
          extensions: ['json']
        }]
      })

      if (filePath) {
        const content = await readTextFile(filePath)
        return content
      }
      return null
    } catch (error) {
      console.error('Failed to load file:', error)
      return null
    }
  }

  async function selectImageFile() {
    try {
      const filePath = await open({
        multiple: false,
        filters: [{
          name: 'Images',
          extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp']
        }]
      })

      return filePath
    } catch (error) {
      console.error('Failed to select image:', error)
      return null
    }
  }

  return {
    saveToFile,
    loadFromFile,
    selectImageFile
  }
}
