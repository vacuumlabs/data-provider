import React from 'react'

const style = {
  position: 'relative',
  top: '50%',
  transform: 'translateY(-50%)',
  fontWeight: 'bold',
}

export const ErrorComponent = () => (
  <div style={style}>
    Failed to load data
  </div>
)
