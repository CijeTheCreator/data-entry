'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { CheckCircle, FileText, Headphones, Undo2, Redo2, Download, ChevronDown, X, Mail, Save, Upload, Loader2 } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
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
  connectedSheet?: {
    sheetUrl: string
    lastSync: string
  }
  currentVersion: number
}

export default function ProcessedPage() {
  const params = useParams()
  const { isSignedIn, isLoaded } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showTextModal, setShowTextModal] = useState(false)
  const [showAudioModal, setShowAudioModal] = useState(false)
  const [showDownloadMenu, setShowDownloadMenu] = useState(false)
  const [textAnalysis, setTextAnalysis] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [isLoadingText, setIsLoadingText] = useState(false)
  const [isLoadingAudio, setIsLoadingAudio] = useState(false)

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

  const handleAudioAnalysis = async () => {
    setShowAudioModal(true)
    setIsLoadingAudio(true)
    
    try {
      const response = await fetch('/api/generate-audio-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: params.id })
      })

      if (response.ok) {
        const data = await response.json()
        setAudioUrl(data.audioUrl)
      } else {
        throw new Error('Failed to generate audio analysis')
      }
    } catch (error) {
      console.error('Audio analysis error:', error)
      toast.error('Failed to generate audio analysis')
    } finally {
      setIsLoadingAudio(false)
    }
  }

  const handleDownload = (format: string) => {
    window.open(`/api/download/${params.id}/${format}`, '_blank')
    setShowDownloadMenu(false)
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
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Sign in to view this project
          </h1>
          <p className="text-lg text-gray-600">
            You need to be signed in to access project details.
          </p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Project not found
          </h1>
          <p className="text-lg text-gray-600">
            The project you're looking for doesn't exist or you don't have access to it.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <span className="text-lg font-medium text-gray-800">
              {project.connectedSheet ? 'Synced with Google Sheets' : 'Processing Complete'}
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors" title="Undo">
              <Undo2 className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors" title="Redo">
              <Redo2 className="w-5 h-5" />
            </button>
            
            <div className="relative">
              <button
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showDownloadMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="aspect-video bg-gray-100">
              {project.fileUrls[project.fileUrls.length - 1] ? (
                <Image
                  src={project.fileUrls[project.fileUrls.length - 1]}
                  alt="Processed document"
                  width={800}
                  height={450}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <FileText className="w-16 h-16" />
                </div>
              )}
            </div>
          </div>

          {/* Analysis Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Document Analysis</h3>
              
              <div className="space-y-4">
                <button
                  onClick={handleTextAnalysis}
                  className="w-full bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center justify-center space-x-3"
                >
                  <FileText className="w-5 h-5" />
                  <span>Generate Text Analysis</span>
                </button>
                
                <button
                  onClick={handleAudioAnalysis}
                  className="w-full bg-purple-600 text-white px-6 py-4 rounded-lg hover:bg-purple-700 transition-colors font-medium inline-flex items-center justify-center space-x-3"
                >
                  <Headphones className="w-5 h-5" />
                  <span>Generate Audio Analysis</span>
                </button>

                <button className="w-full bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 transition-colors font-medium inline-flex items-center justify-center space-x-3">
                  <Upload className="w-5 h-5" />
                  <span>Upload Additional Files</span>
                </button>
              </div>
            </div>

            {/* Document Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Project Details</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Project Name:</span>
                  <span className="font-medium">{project.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Processed:</span>
                  <span className="font-medium">{formatTimeAgo(project.updatedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="text-green-600 font-medium capitalize">{project.status.toLowerCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Data Points:</span>
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
          <div className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Text Analysis</h2>
              <button
                onClick={() => setShowTextModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {isLoadingText ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Analyzing document content...</p>
              </div>
            ) : (
              <div className="prose prose-blue max-w-none">
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {textAnalysis}
                </div>
              </div>
            )}

            {!isLoadingText && textAnalysis && (
              <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                <button className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors inline-flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>Send via Email</span>
                </button>
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center space-x-2">
                  <Save className="w-4 h-4" />
                  <span>Save Analysis</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audio Analysis Modal */}
      {showAudioModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Audio Analysis</h2>
              <button
                onClick={() => setShowAudioModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {isLoadingAudio ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Generating audio analysis...</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-8 mb-6">
                  <div className="flex items-center justify-center space-x-4 text-white">
                    <Headphones className="w-8 h-8" />
                    <div className="text-left">
                      <h3 className="text-lg font-semibold">Document Analysis Audio</h3>
                      <p className="text-purple-100">Duration: 2:34</p>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <audio controls className="w-full" src={audioUrl}>
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-center space-x-2 text-purple-100 text-sm">
                    <div className="flex space-x-1">
                      {[...Array(12)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-1 bg-white rounded-full ${
                            i < 8 ? 'h-4 opacity-100' : 'h-2 opacity-50'
                          }`}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-4">
                  AI-generated audio summary of your document analysis, highlighting key insights and data points.
                </p>
              </div>
            )}

            {!isLoadingAudio && audioUrl && (
              <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                <button className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors inline-flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>Send via Email</span>
                </button>
                <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium inline-flex items-center space-x-2">
                  <Save className="w-4 h-4" />
                  <span>Save Audio</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}