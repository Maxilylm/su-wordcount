import { useState, useMemo } from 'react'
import './App.css'

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '')
  if (word.length <= 3) return 1
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
  word = word.replace(/^y/, '')
  const matches = word.match(/[aeiouy]{1,2}/g)
  return matches ? matches.length : 1
}

interface Stats {
  words: number
  characters: number
  charactersNoSpaces: number
  sentences: number
  paragraphs: number
  readingTime: string
  fleschScore: number
  gradeLevel: number
  keywords: { word: string; count: number; percentage: number }[]
}

function analyze(text: string): Stats {
  const characters = text.length
  const charactersNoSpaces = text.replace(/\s/g, '').length
  const wordsArr = text.trim() ? text.trim().split(/\s+/) : []
  const words = wordsArr.length
  const sentences = text.trim()
    ? (text.match(/[.!?]+/g) || []).length || (words > 0 ? 1 : 0)
    : 0
  const paragraphs = text.trim()
    ? text.split(/\n\s*\n/).filter((p) => p.trim()).length || (text.trim() ? 1 : 0)
    : 0

  const minutes = words / 200
  const readingTime =
    minutes < 1 ? '< 1 min' : `${Math.ceil(minutes)} min`

  let fleschScore = 0
  let gradeLevel = 0
  if (words > 0 && sentences > 0) {
    const totalSyllables = wordsArr.reduce(
      (sum, w) => sum + countSyllables(w),
      0
    )
    fleschScore =
      206.835 -
      1.015 * (words / sentences) -
      84.6 * (totalSyllables / words)
    fleschScore = Math.max(0, Math.min(100, Math.round(fleschScore * 10) / 10))
    gradeLevel =
      0.39 * (words / sentences) + 11.8 * (totalSyllables / words) - 15.59
    gradeLevel = Math.max(0, Math.round(gradeLevel * 10) / 10)
  }

  // keyword density
  const freq: Record<string, number> = {}
  const stopWords = new Set([
    'the','a','an','and','or','but','in','on','at','to','for','of','with',
    'by','from','is','it','as','was','are','be','has','had','have','this',
    'that','not','no','do','if','so','we','he','she','they','i','my','me',
    'you','your','its','will','can','all','just','than','then','also',
  ])
  for (const w of wordsArr) {
    const clean = w.toLowerCase().replace(/[^a-z']/g, '')
    if (clean.length > 1 && !stopWords.has(clean)) {
      freq[clean] = (freq[clean] || 0) + 1
    }
  }
  const keywords = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({
      word,
      count,
      percentage: Math.round((count / words) * 1000) / 10,
    }))

  return {
    words,
    characters,
    charactersNoSpaces,
    sentences,
    paragraphs,
    readingTime,
    fleschScore,
    gradeLevel,
    keywords,
  }
}

function readabilityLabel(score: number): { label: string; color: string } {
  if (score >= 60) return { label: 'Easy', color: '#4ade80' }
  if (score >= 30) return { label: 'Medium', color: '#facc15' }
  return { label: 'Hard', color: '#f87171' }
}

function App() {
  const [text, setText] = useState('')
  const stats = useMemo(() => analyze(text), [text])
  const readability = readabilityLabel(stats.fleschScore)

  return (
    <div className="app">
      <header>
        <h1>Word Counter</h1>
        <p className="subtitle">Paste or type text to get live stats</p>
      </header>

      <div className="main">
        <div className="editor-col">
          <div className="toolbar">
            <span className="word-badge">{stats.words} words</span>
            <button className="clear-btn" onClick={() => setText('')}>
              Clear
            </button>
          </div>
          <textarea
            className="editor"
            placeholder="Start typing or paste your text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
          />
        </div>

        <div className="stats-col">
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-value">{stats.words}</span>
              <span className="stat-label">Words</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.characters}</span>
              <span className="stat-label">Characters</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.charactersNoSpaces}</span>
              <span className="stat-label">Chars (no spaces)</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.sentences}</span>
              <span className="stat-label">Sentences</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.paragraphs}</span>
              <span className="stat-label">Paragraphs</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.readingTime}</span>
              <span className="stat-label">Reading Time</span>
            </div>
          </div>

          <div className="readability-card">
            <h2>Readability</h2>
            <div className="readability-row">
              <div>
                <span className="score" style={{ color: readability.color }}>
                  {stats.words > 0 ? stats.fleschScore : '—'}
                </span>
                <span className="score-label">Flesch Score</span>
              </div>
              <div>
                <span
                  className="grade-badge"
                  style={{ backgroundColor: readability.color, color: '#111' }}
                >
                  {stats.words > 0 ? readability.label : '—'}
                </span>
                <span className="score-label">
                  Grade Level: {stats.words > 0 ? stats.gradeLevel : '—'}
                </span>
              </div>
            </div>
          </div>

          {stats.keywords.length > 0 && (
            <div className="keywords-card">
              <h2>Top Keywords</h2>
              <table>
                <thead>
                  <tr>
                    <th>Word</th>
                    <th>Count</th>
                    <th>%</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.keywords.map((k) => (
                    <tr key={k.word}>
                      <td>{k.word}</td>
                      <td>{k.count}</td>
                      <td>{k.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
