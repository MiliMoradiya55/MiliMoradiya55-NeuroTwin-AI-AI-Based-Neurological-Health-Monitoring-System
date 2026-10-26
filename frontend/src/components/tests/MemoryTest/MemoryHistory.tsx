// src/components/tests/MemoryTest/MemoryHistory.tsx

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { memoryService } from '@/services/memoryService'
import { FiClock, FiAward, FiTrendingUp } from 'react-icons/fi'
import toast from 'react-hot-toast'

interface MemoryHistoryProps {
  userId: number
}

const MemoryHistory: React.FC<MemoryHistoryProps> = ({ userId }) => {
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    average: 0,
    best: 0,
    latest: 0,
    total: 0
  })

  useEffect(() => {
    fetchHistory()
  }, [userId])

  const fetchHistory = async () => {
    try {
      const response = await memoryService.getHistory(userId)
      if (response.status === 'success') {
        const data = response.data || []
        setHistory(data)
        
        if (data.length > 0) {
          const scores = data.map((item: any) => item.score)
          setStats({
            average: Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length),
            best: Math.round(Math.max(...scores)),
            latest: Math.round(scores[0] || 0),
            total: data.length
          })
        }
      }
    } catch (error) {
      console.error('Error fetching memory history:', error)
      toast.error('Failed to load memory history')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <h4 className="font-semibold text-slate-800 dark:text-white mb-1">Memory History</h4>
        <p className="text-sm text-slate-500">No memory assessments recorded yet.</p>
        <p className="text-xs text-slate-400 mt-1">Complete a memory test to start tracking!</p>
      </div>
    )
  }

  return (
    <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-slate-800 dark:text-white">Memory History</h4>
        <span className="text-xs text-slate-400">{stats.total} assessments</span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-center">
          <p className="text-xs text-slate-500">Latest</p>
          <p className="text-lg font-bold text-indigo-600">{stats.latest}%</p>
        </div>
        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-center">
          <p className="text-xs text-slate-500">Best</p>
          <p className="text-lg font-bold text-emerald-600">{stats.best}%</p>
        </div>
        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
          <p className="text-xs text-slate-500">Average</p>
          <p className="text-lg font-bold text-purple-600">{stats.average}%</p>
        </div>
      </div>

      <div className="space-y-1.5 max-h-[150px] overflow-y-auto">
        {history.slice(0, 5).map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm p-2 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
            <span className="text-slate-600 dark:text-slate-300">{item.memory_level}</span>
            <div className="flex items-center gap-3">
              <span className="text-slate-500 text-xs">
                {new Date(item.completed_at).toLocaleDateString()}
              </span>
              <span className="font-bold text-indigo-600">{Math.round(item.score)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MemoryHistory