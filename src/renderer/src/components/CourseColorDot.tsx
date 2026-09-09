import { useState } from 'react'
import { useStore } from '../store'
import { COURSE_COLOR_PALETTE, courseKey } from '../../../shared/courseColor'

export default function CourseColorDot({ summary, color }: { summary: string; color: string }): JSX.Element {
  const { settings, setCourseColor } = useStore()
  const [open, setOpen] = useState(false)
  const key = courseKey(summary)
  const hasOverride = !!settings.courseColors?.[key]

  return (
    <div className="course-color-dot-wrap">
      <button
        className="course-color-dot"
        style={{ background: color }}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((o) => !o)
        }}
        data-tooltip="Changer la couleur de ce cours"
      />
      {open && (
        <>
          <div className="popover-backdrop" onClick={() => setOpen(false)} />
          <div className="course-color-popover" onClick={(e) => e.stopPropagation()}>
            {COURSE_COLOR_PALETTE.map((c) => (
              <button
                key={c}
                className={`course-color-swatch ${c === color ? 'selected' : ''}`}
                style={{ background: c }}
                onClick={() => {
                  setCourseColor(key, c)
                  setOpen(false)
                }}
              />
            ))}
            {hasOverride && (
              <button className="course-color-reset" onClick={() => { setCourseColor(key, null); setOpen(false) }}>
                Auto
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
