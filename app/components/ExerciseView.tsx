'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Webcam from 'react-webcam'
import * as poseDetection from '@tensorflow-models/pose-detection'
import * as tf from '@tensorflow/tfjs-core'
import '@tensorflow/tfjs-backend-webgl'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card'
import { RealTimeResults } from './RealTimeResults'
import { TargetPoseImage } from './TargetPoseImage'

export function ExerciseView() {
  const webcamRef = useRef<Webcam>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [detector, setDetector] = useState<poseDetection.PoseDetector | null>(
    null
  )
  const [poses, setPoses] = useState<poseDetection.Pose[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const drawPose = useCallback(
    (poses: poseDetection.Pose[]) => {
      const ctx = canvasRef.current?.getContext('2d')
      if (!ctx || poses.length === 0) return

      // Clear the canvas
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

      // Set canvas size to match video
      const video = webcamRef.current?.video
      if (video) {
        ctx.canvas.width = video.videoWidth
        ctx.canvas.height = video.videoHeight
      }

      poses[0].keypoints.forEach((keypoint) => {
        if (keypoint.score && keypoint.score > 0.3) {
          // Draw keypoint
          ctx.beginPath()
          ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI)
          ctx.fillStyle = 'red'
          ctx.fill()

          // Draw keypoint name
          ctx.font = '12px Arial'
          ctx.fillStyle = 'white'
          ctx.fillText(keypoint.name, keypoint.x + 5, keypoint.y - 5)
        }
      })

      // Draw skeleton
      const skeleton = [
        ['left_shoulder', 'right_shoulder'],
        ['left_shoulder', 'left_elbow'],
        ['right_shoulder', 'right_elbow'],
        ['left_elbow', 'left_wrist'],
        ['right_elbow', 'right_wrist'],
        ['left_shoulder', 'left_hip'],
        ['right_shoulder', 'right_hip'],
        ['left_hip', 'right_hip'],
        ['left_hip', 'left_knee'],
        ['right_hip', 'right_knee'],
        ['left_knee', 'left_ankle'],
        ['right_knee', 'right_ankle'],
      ]

      skeleton.forEach(([startPoint, endPoint]) => {
        const start = poses[0].keypoints.find((kp) => kp.name === startPoint)
        const end = poses[0].keypoints.find((kp) => kp.name === endPoint)
        if (start && end && start.score > 0.3 && end.score > 0.3) {
          ctx.beginPath()
          ctx.moveTo(start.x, start.y)
          ctx.lineTo(end.x, end.y)
          ctx.strokeStyle = 'blue'
          ctx.lineWidth = 2
          ctx.stroke()
        }
      })
    },
    [webcamRef]
  )

  useEffect(() => {
    async function initializeDetector() {
      await tf.ready()
      const detectorConfig = {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        runtime: 'tfjs-webgl',
      }
      const detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        detectorConfig
      )
      setDetector(detector)
    }
    initializeDetector()
  }, [])

  useEffect(() => {
    if (detector) {
      const intervalId = setInterval(async () => {
        if (webcamRef.current && webcamRef.current.video) {
          const video = webcamRef.current.video
          if (
            video.readyState === 4 &&
            video.videoWidth > 0 &&
            video.videoHeight > 0
          ) {
            try {
              const newPoses = await detector.estimatePoses(video)
              setPoses(newPoses)
              drawPose(newPoses)
            } catch (error) {
              console.error('Error estimating poses:', error)
            }
          }
        }
      }, 100)
      return () => clearInterval(intervalId)
    }
  }, [detector, drawPose])

  useEffect(() => {
    if (webcamRef.current) {
      console.log('Webcam ref is set')
    }
  }, [])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Camera View</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {isLoading && <p>Loading camera...</p>}
              {error && <p className="text-red-500">Error: {error}</p>}
              <Webcam
                ref={webcamRef}
                mirrored
                className="w-full"
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  width: 720,
                  height: 480,
                  facingMode: 'user',
                }}
                onUserMedia={() => {
                  console.log('Camera access granted')
                  setIsLoading(false)
                }}
                onUserMediaError={(err) => {
                  console.error('Camera error:', err)
                  setError('Failed to access camera')
                  setIsLoading(false)
                }}
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full"
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Target Pose</CardTitle>
          </CardHeader>
          <CardContent>
            <TargetPoseImage />
          </CardContent>
        </Card>
      </div>
      <RealTimeResults poses={poses} />
    </div>
  )
}
