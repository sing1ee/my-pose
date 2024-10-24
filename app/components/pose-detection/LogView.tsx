'use client'

import { useState } from 'react'

import { format } from 'date-fns'
import Image from 'next/image' // Add this import

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/app/components/ui/collapsible'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/app/components/ui/popover'
import { ScrollArea } from '@/app/components/ui/scroll-area'

import { PoseLogEntry } from './types'

interface LogViewProps {
  logs: PoseLogEntry[]
}

export function LogView({ logs }: LogViewProps) {
  return (
    <ScrollArea className="w-full rounded-md border p-4">
      <div className="space-y-4">
        {logs.map((log) => (
          <LogEntry key={log.id} entry={log} />
        ))}
      </div>
    </ScrollArea>
  )
}

function LogEntry({ entry }: { entry: PoseLogEntry }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="flex items-start space-x-4 p-4 border rounded-lg">
      <Popover>
        <PopoverTrigger asChild>
          <Image
            src={entry.screenshot}
            alt="Pose screenshot"
            width={128}
            height={128}
            className="object-cover rounded cursor-pointer" // Added cursor pointer
          />
        </PopoverTrigger>
        <PopoverContent>
          <Image
            src={entry.screenshot}
            alt="Enlarged Pose screenshot"
            width={1000} // Set appropriate enlarged width
            height={1000} // Set appropriate enlarged height
            className="object-cover rounded"
          />
        </PopoverContent>
      </Popover>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-500">
            {format(entry.timestamp, 'HH:mm:ss')}
          </span>
          <span className="font-semibold">
            Similarity: {entry.similarity.toFixed(8)}
          </span>
        </div>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="text-sm text-blue-500">
            {isOpen ? 'Hide Details' : 'Show Details'}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded">
              {JSON.stringify(entry.pose, null, 2)}
            </pre>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  )
}
