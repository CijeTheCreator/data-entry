'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { CheckCircle, FileText, Download, ChevronDown, X, Upload, Loader2, ExternalLink } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { toast } from 'react-hot-toast'
import Navigation from '@/components/Navigation'

interface Project {
  id: string
  name: string
  fileUrls: string[]
  status: string
  dataPoints: number
  createdAt: string
  updatedAt: string
  screenshotUrl: string
  connectedSheet?: {
    spreadsheetUrl: string
    lastSync: string
  }
  currentVersion: number
}

export default function ProcessedPage() {
  const params = useParams()
  const { isSignedIn, isLoaded } = useUser()
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showTextModal, setShowTextModal] = useState(false)
  const [showDownloadMenu, setShowDownloadMenu] = useState(false)
  const [textAnalysis, setTextAnalysis] = useState('')
  const [isLoadingText, setIsLoadingText] = useState(false)
  const [isUploadingFiles, setIsUploadingFiles] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isLoaded && isSignedIn && params.id) {
      fetchProject()
    } else if (isLoaded) {
      setIsLoading(false)
    }
  }, [isSignedIn, isLoaded, params.id])

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/project/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setProject(data)
      } else if (response.status === 404) {
        toast.error('Project not found')
      }
    } catch (error) {
      console.error('Failed to fetch project:', error)
      toast.error('Failed to load project')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTextAnalysis = async () => {
    setShowTextModal(true)
    setIsLoadingText(true)

    try {
      const response = await fetch('/api/generate-text-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: params.id })
      })

      if (response.ok) {
        const data = await response.json()
        setTextAnalysis(data.analysis)
      } else {
        throw new Error('Failed to generate analysis')
      }
    } catch (error) {
      console.error('Text analysis error:', error)
      toast.error('Failed to generate text analysis')
    } finally {
      setIsLoadingText(false)
    }
  }

  const handleDownload = (format: string) => {
    window.open(`/api/download/${params.id}/${format}`, '_blank')
    setShowDownloadMenu(false)
  }

  const handleAdditionalFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    setIsUploadingFiles(true)
    setIsSyncing(true)

    try {
      const uploadPromises = Array.from(selectedFiles).map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload-file', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }

        return response.json()
      })

      const uploadResults = await Promise.all(uploadPromises)
      const fileUrls = uploadResults.map(result => result.url)

      // Process additional files
      const processResponse = await fetch('/api/additional-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: params.id,
          fileUrls
        })
      })

      if (!processResponse.ok) {
        throw new Error('Failed to process additional files')
      }

      toast.success('Additional files processed successfully!')
      await fetchProject() // Refresh project data
    } catch (error) {
      console.error('Additional files error:', error)
      toast.error('Failed to process additional files')
    } finally {
      setIsUploadingFiles(false)
      setIsSyncing(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
    return `${Math.floor(diffInMinutes / 1440)} days ago`
  }

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-6 py-8 pt-24">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-4xl mx-auto px-6 py-20 pt-32 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Sign in to view this project
          </h1>
          <p className="text-lg text-muted">
            You need to be signed in to access project details.
          </p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-4xl mx-auto px-6 py-20 pt-32 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Project not found
          </h1>
          <p className="text-lg text-muted">
            The project you're looking for doesn't exist or you don't have access to it.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-7xl mx-auto px-6 py-8 pt-24">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <span className="text-lg font-medium text-gray-800">
              {isSyncing ? 'Syncing...' : project.connectedSheet ? 'Synced with Google Sheets' : 'Processing Complete'}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary transition-colors font-medium inline-flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showDownloadMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-surface rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                  <button
                    onClick={() => handleDownload('csv')}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors"
                  >
                    CSV
                  </button>
                  <button
                    onClick={() => handleDownload('json')}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors"
                  >
                    JSON
                  </button>
                  <button
                    onClick={() => handleDownload('xls')}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors"
                  >
                    XLS
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Document Preview */}
          <div className="bg-surface rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="aspect-video bg-gray-100 relative group">
              {project.screenshotUrl ? (
                <a
                  href={project.connectedSheet?.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full h-full"
                >
                  <Image
                    src={project.screenshotUrl}
                    alt="Processed document"
                    width={800}
                    height={450}
                    className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
                    <ExternalLink className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </a>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <FileText className="w-16 h-16" />
                </div>
              )}
            </div>
          </div>

          {/* Analysis Actions */}
          <div className="space-y-6">
            <div className="bg-surface rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Document Options</h3>

              <div className="space-y-4">
                <button
                  onClick={handleTextAnalysis}
                  className="w-full bg-primary text-white px-6 py-4 rounded-lg hover:bg-secondary transition-colors font-medium inline-flex items-center justify-center space-x-3"
                >
                  <FileText className="w-5 h-5" />
                  <span>Analyse Data</span>
                </button>

                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                    onChange={handleAdditionalFiles}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingFiles}
                    className="w-full bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 transition-colors font-medium inline-flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploadingFiles ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        <span>Upload Additional Files</span>
                      </>
                    )}
                  </button>
                </div>

                {project.connectedSheet && (
                  <a
                    href={project.connectedSheet.spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center justify-center space-x-3"
                  >
                    <ExternalLink className="w-5 h-5" />
                    <span>Go to Spreadsheet</span>
                  </a>
                )}
              </div>
            </div>

            {/* Document Info */}
            <div className="bg-surface rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Project Details</h3>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted">Project Name:</span>
                  <span className="font-medium">{project.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Processed:</span>
                  <span className="font-medium">{formatTimeAgo(project.updatedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Status:</span>
                  <span className="text-green-600 font-medium capitalize">{project.status.toLowerCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Data Points:</span>
                  <span className="font-medium">{project.dataPoints} extracted</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Text Analysis Modal */}
      {showTextModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl p-8 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Data Analysis</h2>
              <button
                onClick={() => setShowTextModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {isLoadingText ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted">Analyzing document content...</p>
              </div>
            ) : (
              <div className="prose prose-gray max-w-none">
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {textAnalysis}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}