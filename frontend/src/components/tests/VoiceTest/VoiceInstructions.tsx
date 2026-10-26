import React from 'react'

const VoiceInstructions: React.FC = () => {
  return (
    <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-800 text-sm text-indigo-900 dark:text-indigo-200">
      <h4 className="font-semibold mb-1">Vocal Task Instructions</h4>
      <p>Sustain a steady "Ahhh" sound for 5 seconds into your microphone in a quiet room.</p>
    </div>
  )
}

export default VoiceInstructions
