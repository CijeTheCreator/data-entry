'use client'

import { useState, useRef } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { toast } from 'react-hot-toast'
import ProjectSetupModal from './ProjectSetupModal'

interface FileData {
  url: string
  name: string
}

interface FileUploadProps {
  onFileSelect?: (files: File[]) => void
}

export default function FileUpload({ onFileSelect }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<FileData[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { isSignedIn, isLoaded } = useUser()

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(Array.from(files))
    }
  }

  const handleFileUpload = async (files: File[]) => {
    if (!isSignedIn) {
      toast.error('Please sign in to upload files')
      return
    }

    setIsUploading(true)

    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload-file', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Upload failed for ${file.name}`)
        }

        const data = await response.json()
        return {
          url: data.url,
          name: file.name
        }
      })

      const uploadResults = await Promise.all(uploadPromises)
      setUploadedFiles(uploadResults)
      setShowSetupModal(true)

      if (onFileSelect) {
        onFileSelect(files)
      }

      toast.success(`${files.length} file${files.length > 1 ? 's' : ''} uploaded successfully`)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Upload failed, please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const isUserLoading = !isLoaded

  return (
    <>
      {/* Drag Overlay */}
      {isDragOver && (
        <div className="fixed inset-0 bg-primary bg-opacity-90 z-50 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="text-4xl font-bold mb-4">Drop files anywhere</div>
            <div className="text-lg opacity-80">Smart Document Processing</div>
          </div>

          {/* Corner Decorations */}
          <div className="absolute top-8 left-8 w-16 h-16 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
          <div className="absolute top-8 right-8 w-16 h-16 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
          <div className="absolute bottom-8 left-8 w-16 h-16 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
          <div className="absolute bottom-8 right-8 w-16 h-16 border-b-4 border-r-4 border-white rounded-br-lg"></div>
        </div>
      )}

      {/* Loading Overlay */}
      {isUploading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-surface rounded-lg p-8 text-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <div className="text-lg font-medium">Processing your files...</div>
            <div className="text-muted mt-2">This may take a few moments</div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        className="relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileInput}
          className="hidden"
          accept="image/*,.pdf,.zip,.doc,.docx,audio/*"
          multiple
        />

        <div className="text-center">
          <button
            onClick={openFileDialog}
            disabled={isUserLoading}
            className="bg-primary hover:bg-secondary text-white px-8 py-3 rounded-lg font-medium text-lg mb-4 transition-colors inline-flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUserLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span>Upload Files</span>
              </>
            )}
          </button>

          <div className="text-muted">
            or drop files, <button onClick={openFileDialog} className="text-primary hover:underline" disabled={isUserLoading}>click here</button>
          </div>
        </div>
      </div>

      {/* Project Setup Modal */}
      {showSetupModal && uploadedFiles.length > 0 && (
        <ProjectSetupModal
          initialFiles={uploadedFiles}
          onClose={() => {
            setShowSetupModal(false)
            setUploadedFiles([])
          }}
          onContinue={(projectData) => {
            setShowSetupModal(false)
            setUploadedFiles([])
            // Navigation will be handled by the modal
          }}
        />
      )}
    </>
  )
}