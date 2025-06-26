'use client'

import { useState, useRef } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import ProjectSetupModal from './ProjectSetupModal'

interface FileUploadProps {
  onFileSelect?: (file: File) => void
}

export default function FileUpload({ onFileSelect }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleFileUpload = async (file: File) => {
    setIsUploading(true)
    setUploadedFile(file)
    
    // Simulate upload
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsUploading(false)
    setShowSetupModal(true)
    
    if (onFileSelect) {
      onFileSelect(file)
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <>
      {/* Drag Overlay */}
      {isDragOver && (
        <div className="fixed inset-0 bg-blue-600 bg-opacity-90 z-50 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="text-4xl font-bold mb-4">Drop file anywhere</div>
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
          <div className="bg-white rounded-lg p-8 text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <div className="text-lg font-medium">Processing your file...</div>
            <div className="text-gray-600 mt-2">This may take a few moments</div>
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
          accept="image/*,.pdf,.zip,.doc,.docx"
        />
        
        <div className="text-center">
          <button
            onClick={openFileDialog}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium text-lg mb-4 transition-colors inline-flex items-center space-x-2"
          >
            <Upload className="w-5 h-5" />
            <span>Upload File</span>
          </button>
          
          <div className="text-gray-600">
            or drop a file, <button onClick={openFileDialog} className="text-blue-600 hover:underline">click here</button>
          </div>
        </div>
      </div>

      {/* Project Setup Modal */}
      {showSetupModal && uploadedFile && (
        <ProjectSetupModal
          file={uploadedFile}
          onClose={() => setShowSetupModal(false)}
          onContinue={(projectData) => {
            console.log('Project setup:', projectData)
            setShowSetupModal(false)
            // Navigate to processed page
            window.location.href = `/processed/${Date.now()}`
          }}
        />
      )}
    </>
  )
}