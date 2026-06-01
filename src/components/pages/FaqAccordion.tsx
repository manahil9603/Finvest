'use client'

import { useState, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export interface FaqItem {
  q:        string
  a:        string
  category: string
}

interface Props {
  items:      FaqItem[]
  categories: string[]
}

export function FaqAccordion({ items, categories }: Props) {
  const [open,    setOpen]    = useState<number | null>(null)
  const [filter,  setFilter]  = useState('All')
  const [search,  setSearch]  = useState('')

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchCat = filter === 'All' || item.category === filter
      const matchQ   = !search || item.q.toLowerCase().includes(search.toLowerCase())
      const matchA   = !search || item.a.toLowerCase().includes(search.toLowerCase())
      return matchCat && (matchQ || matchA)
    })
  }, [items, filter, search])

  const toggle = (i: number) => setOpen(open === i ? null : i)

  return (
    <div>
      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
               width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2.5" strokeLinecap="round" style={{ color: 'rgba(255,255,255,0.3)' }} aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="input pl-10 text-sm"
            placeholder="Search questions…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setOpen(null) }}
            aria-label="Search frequently asked questions"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {['All', ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => { setFilter(cat); setOpen(null) }}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
              style={
                filter === cat
                  ? { background: 'rgba(139,92,246,0.2)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.4)' }
                  : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }
              }
              aria-pressed={filter === cat}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Accordion */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-fg-3">
          <div className="text-3xl mb-3">🔍</div>
          <p>No questions match your search. Try a different term.</p>
        </div>
      ) : (
        <div className="space-y-3" role="list">
          {filtered.map((item, i) => {
            const isOpen = open === i
            return (
              <div
                key={i}
                role="listitem"
                className="rounded-2xl overflow-hidden transition-all duration-200"
                style={{
                  background: isOpen ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.04)',
                  border:     isOpen ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                  onClick={() => toggle(i)}
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-semibold text-foreground pr-4">{item.q}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(139,92,246,0.12)', color: '#A78BFA' }}
                    >
                      {item.category}
                    </span>
                    <svg
                      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2.5" strokeLinecap="round"
                      style={{
                        color: isOpen ? '#A78BFA' : 'rgba(255,255,255,0.35)',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                        transition: 'transform 0.2s',
                      }}
                      aria-hidden="true"
                    >
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div
                        className="px-5 pb-5 text-sm text-fg-2 leading-relaxed"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '14px' }}
                        dangerouslySetInnerHTML={{ __html: item.a.replace(/\n\n/g, '<br/><br/>') }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      )}

      <p className="text-xs text-fg-3 text-center mt-8">
        Still have questions?{' '}
        <a href="/contact" className="font-semibold" style={{ color: '#A78BFA' }}>Contact support →</a>
      </p>
    </div>
  )
}
