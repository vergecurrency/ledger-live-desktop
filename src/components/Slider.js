// @flow
import React, { useState, useRef, useCallback, useEffect } from 'react'

const primaryColor = '#6591F3'
const primaryColorHover = '#749cf3'
const secondaryColor = '#F0EFF1'
const buttonInnerColor = '#FFFFFF'

const touches = typeof window !== 'undefined' && 'ontouchstart' in window

type Props = {
  steps: number,
  value: number,
  onChange: number => void,
}

function xForEvent(node, e) {
  if (!node) throw new Error('node expected')
  const { clientX } = e
  const { left } = node.getBoundingClientRect()
  return clientX - left
}

const Handle = React.memo(({ active, x }: { active: boolean, x: number }) => {
  const [hover, setHover] = useState(false)
  const onMouseEnter = useCallback(() => setHover(true), [])
  const onMouseLeave = useCallback(() => setHover(false), [])

  const size = 14
  const style = {
    boxSizing: 'border-box',
    cursor: active ? 'ew-resize' : 'pointer',
    WebkitTapHighlightColor: 'rgba(0,0,0,0)',
    boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.09)',
    left: `${(100 * x).toPrecision(3)}%`,
    width: 2 * size,
    height: 2 * size,
    borderRadius: 2 * size,
    position: 'absolute',
    backgroundColor: hover || active ? primaryColorHover : primaryColor,
    border: '2px solid',
    borderColor: buttonInnerColor,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transition: '100ms transform',
    transform: `translate(-${size + 2}px,-${size + 2}px) scale(${active ? 1.1 : 1})`,
  }
  const innerDotSize = 6
  const innerDotStyle = {
    width: innerDotSize,
    height: innerDotSize,
    borderRadius: innerDotSize,
    backgroundColor: buttonInnerColor,
  }

  return (
    <div style={style} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <span style={innerDotStyle} />
    </div>
  )
})

const Track = React.memo(({ x }: { x: number }) => (
  <div
    style={{
      width: `${(100 * x).toPrecision(3)}%`,
      height: 4,
      borderRadius: 4,
      backgroundColor: primaryColor,
    }}
  />
))

const Slider = ({ steps, value, onChange }: Props) => {
  const [down, setDown] = useState(false)
  const root = useRef(null)
  const internalPadding = 12

  const reverseX = useCallback(
    x => {
      if (!root.current) return 0
      const { width } = root.current.getBoundingClientRect()
      return Math.max(
        0,
        Math.min(
          Math.round(((x - internalPadding) / (width - internalPadding * 2)) * (steps - 1)),
          steps - 1,
        ),
      )
    },
    [steps, root],
  )

  const concernedEvent = useCallback(
    e => {
      if (!touches) {
        return e
      }
      if (!down) return e.targetTouches[0]
      const touchId = down.touchId
      const items = e.changedTouches
      for (let i = 0; i < items.length; ++i) {
        if (items[i].identifier === touchId) return items[i]
      }
      return null
    },
    [down],
  )

  const onHandleStart = useCallback(
    e => {
      const event = concernedEvent(e)
      if (!event) return
      e.preventDefault()
      const x = xForEvent(root.current, event)
      setDown({
        touchId: event.identifier,
        x,
      })
      const valuePos = reverseX(x)
      if (value !== valuePos) onChange(valuePos)
    },
    [root, concernedEvent, reverseX, onChange, value],
  )

  const onHandleMove = useCallback(
    e => {
      const event = concernedEvent(e)
      if (!event) return
      e.preventDefault()
      const x = xForEvent(root.current, event)
      const valuePos = reverseX(x)
      if (value !== valuePos) onChange(valuePos)
    },
    [root, concernedEvent, reverseX, value, onChange],
  )

  const onHandleEnd = useCallback(
    e => {
      const event = concernedEvent(e)
      if (!event) return
      setDown(null)
    },
    [concernedEvent],
  )

  const onHandleAbort = onHandleEnd

  useEffect(
    // eslint-disable-next-line consistent-return
    () => {
      const { body } = document
      if (down && !touches && body) {
        window.addEventListener('mousemove', onHandleMove)
        window.addEventListener('mouseup', onHandleEnd)
        // $FlowFixMe
        body.addEventListener('mouseleave', onHandleAbort)
        return () => {
          window.removeEventListener('mousemove', onHandleMove)
          window.addEventListener('mouseup', onHandleEnd)
          // $FlowFixMe
          body.removeEventListener('mouseleave', onHandleAbort)
        }
      }
    },
    [down, onHandleAbort, onHandleEnd, onHandleMove],
  )

  const events = touches
    ? {
        onTouchStart: onHandleStart,
        onTouchEnd: onHandleEnd,
        onTouchMove: onHandleMove,
        onTouchCancel: onHandleAbort,
      }
    : { onMouseDown: onHandleStart }

  const x = value / (steps - 1)

  return (
    <div
      ref={root}
      {...events}
      style={{
        boxSizing: 'border-box',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        padding: '10px 0',
      }}
    >
      <div
        style={{
          width: '100%',
          height: 4,
          borderRadius: 4,
          backgroundColor: secondaryColor,
          position: 'relative',
        }}
      >
        <Track x={x} />
        <div
          style={{
            width: '100%',
            padding: `0 ${internalPadding}px`,
            boxSizing: 'border-box',
          }}
        >
          <div style={{ position: 'relative' }}>
            <Handle active={!!down} x={x} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Slider
