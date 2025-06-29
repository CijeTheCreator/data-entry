'use client'

import { useState, useEffect } from 'react'
import { X, RefreshCw, Plus, Check, AlertCircle, Loader2, Upload, FileText, Trash2, Copy } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

interface FileData {
  url: string
  name: string
}

interface ProjectSetupModalProps {
  fileUrl?: string
  fileName?: string
  initialFiles?: FileData[]
  onClose: () => void
  onContinue: (data: any) => void
}

export default function ProjectSetupModal({
  fileUrl,
  fileName,
  initialFiles = [],
  onClose,
  onContinue
}: ProjectSetupModalProps) {
  const [projectName, setProjectName] = useState('')
  const [activeTab, setActiveTab] = useState<'scratch' | 'existing'>('scratch')
  const [columnNames, setColumnNames] = useState<string[]>([])
  const [context, setContext] = useState('')
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('')
  const [newColumn, setNewColumn] = useState('')
  const [files, setFiles] = useState<FileData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const [accessStatus, setAccessStatus] = useState<{
    checking: boolean
    verified: boolean
    error: string | null
    title?: string
    serviceAccountEmail?: string
  }>({
    checking: false,
    verified: false,
    error: null
  })
  const router = useRouter()

  const serviceAccountEmail = 'entrify@the-worlds-largest-hackathon.iam.gserviceaccount.com'

  useEffect(() => {
    generateProjectName()
  }, [])

  useEffect(() => {
    const initialFileList: FileData[] = []

    if (initialFiles.length > 0) {
      initialFileList.push(...initialFiles)
    }

    if (fileUrl && fileName) {
      const existingFile = initialFileList.find(f => f.url === fileUrl)
      if (!existingFile) {
        initialFileList.push({ url: fileUrl, name: fileName })
      }
    }

    setFiles(initialFileList)
  }, [fileUrl, fileName, initialFiles])

  const generateProjectName = async () => {
    try {
      const response = await fetch('/api/random-project-name')
      const data = await response.json()
      setProjectName(data.name)
    } catch (error) {
      console.error('Failed to generate project name:', error)
      setProjectName('New Project')
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    setIsUploadingFile(true)

    try {
      for (const file of Array.from(selectedFiles)) {
        const existingFile = files.find(f => f.name === file.name)
        if (existingFile) {
          toast.error(`File "${file.name}" is already added`)
          continue
        }

        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload-file', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }

        const data = await response.json()

        setFiles(prevFiles => [...prevFiles, {
          url: data.url,
          name: file.name
        }])

        toast.success(`${file.name} uploaded successfully`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload files. Please try again.')
    } finally {
      setIsUploadingFile(false)
      event.target.value = ''
    }
  }

  const removeFile = (fileToRemove: FileData) => {
    setFiles(files.filter(f => f.url !== fileToRemove.url))
    toast.success('File removed')
  }

  const addColumn = () => {
    if (newColumn.trim() && !columnNames.includes(newColumn.trim())) {
      setColumnNames([...columnNames, newColumn.trim()])
      setNewColumn('')
    }
  }

  const removeColumn = (column: string) => {
    setColumnNames(columnNames.filter(c => c !== column))
  }

  const copyServiceAccount = () => {
    navigator.clipboard.writeText(serviceAccountEmail)
    toast.success('Service account email copied to clipboard!')
  }

  const checkSpreadsheetAccess = async () => {
    if (!spreadsheetUrl.trim()) {
      toast.error('Please enter a Google Sheets URL')
      return
    }

    setAccessStatus({ checking: true, verified: false, error: null })

    try {
      const response = await fetch('/api/sheets/access-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheetUrl: spreadsheetUrl.trim() })
      })

      const data = await response.json()

      if (data.hasAccess) {
        setAccessStatus({
          checking: false,
          verified: true,
          error: null,
          title: data.title,
          serviceAccountEmail: data.serviceAccountEmail
        })
        toast.success('Access verified successfully!')
      } else {
        setAccessStatus({
          checking: false,
          verified: false,
          error: data.error,
          serviceAccountEmail: data.serviceAccountEmail
        })
      }
    } catch (error) {
      console.error('Access check failed:', error)
      setAccessStatus({
        checking: false,
        verified: false,
        error: 'Failed to check access. Please try again.'
      })
    }
  }

  const handleContinue = async () => {
    if (files.length === 0) {
      toast.error('Please add at least one file')
      return
    }

    if (activeTab === 'existing' && !accessStatus.verified) {
      toast.error('Please verify access to the Google Sheet first')
      return
    }

    setIsLoading(true)

    try {
      const data = {
        name: projectName,
        fileUrls: files.map(f => f.url),
        type: activeTab,
        ...(activeTab === 'scratch' ? {
          columnNames,
          context
        } : {
          spreadsheetUrl: spreadsheetUrl.trim(),
          context
        })
      }

      const response = await fetch('/api/create-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to create project')
      }

      const result = await response.json()

      toast.success('Project created successfully!')
      onContinue(data)
      router.push(`/processed/${result.projectId}`)
    } catch (error) {
      console.error('Project creation error:', error)
      toast.error('Failed to create project. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Set up your project</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Project Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Name
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <button
              onClick={generateProjectName}
              className="p-2 text-gray-500 hover:text-primary transition-colors"
              title="Generate new name"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* File Management */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Files ({files.length})
          </label>

          <div className="mb-4">
            <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="text-center">
                {isUploadingFile ? (
                  <div className="flex items-center space-x-2 text-primary">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Uploading...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-gray-500">
                    <Upload className="w-5 h-5" />
                    <span>Click to upload files or drag and drop</span>
                  </div>
                )}
              </div>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isUploadingFile}
              />
            </label>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={`${file.url}-${index}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 truncate">
                      {file.name}
                    </span>
                  </div>
                  <button
                    onClick={() => removeFile(file)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {files.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              No files added yet. Upload files to get started.
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('scratch')}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === 'scratch'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              Create from scratch
            </button>
            <button
              onClick={() => setActiveTab('existing')}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === 'existing'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              Link existing project
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'scratch' ? (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Column Names (Optional)
              </label>
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={newColumn}
                  onChange={(e) => setNewColumn(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addColumn()}
                  placeholder="Enter column name"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <button
                  onClick={addColumn}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {columnNames.map((column) => (
                  <span
                    key={column}
                    className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm flex items-center space-x-1"
                  >
                    <span>{column}</span>
                    <button
                      onClick={() => removeColumn(column)}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Leave empty and AI will decide the columns automatically
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Optional Context for AI
              </label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Provide additional context to help AI understand your documents better..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent h-24 resize-none"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Google Sheets Link
              </label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <input
                    type="url"
                    value={spreadsheetUrl}
                    onChange={(e) => {
                      setSpreadsheetUrl(e.target.value)
                      setAccessStatus({ checking: false, verified: false, error: null })
                    }}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {accessStatus.verified && (
                    <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-600" />
                  )}
                </div>
                <button
                  onClick={checkSpreadsheetAccess}
                  disabled={accessStatus.checking || !spreadsheetUrl.trim()}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {accessStatus.checking ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Check Access</span>
                  )}
                </button>
              </div>

              {/* Service Account Instructions */}
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700 mb-2">
                  <strong>Share your Google Sheet with this service account:</strong>
                </p>
                <div className="flex items-center space-x-2 bg-blue-100 p-2 rounded font-mono text-sm">
                  <span className="flex-1 text-blue-800">{serviceAccountEmail}</span>
                  <button
                    onClick={copyServiceAccount}
                    className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  Give it "Editor" access, then click "Check Access" above.
                </p>
              </div>

              {accessStatus.error && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-red-700">
                      <p className="font-medium mb-1">Access Error</p>
                      <p>{accessStatus.error}</p>
                    </div>
                  </div>
                </div>
              )}

              {accessStatus.verified && accessStatus.title && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <div className="text-sm text-green-700">
                      <span className="font-medium">Access verified:</span> {accessStatus.title}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Optional Context for AI
              </label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Provide additional context to help AI understand your documents better..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent h-24 resize-none"
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4 mt-8">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2 text-muted hover:text-gray-800 font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleContinue}
            disabled={isLoading || files.length === 0}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition-colors font-medium disabled:opacity-50 flex items-center space-x-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Continue</span>
          </button>
        </div>
      </div>
    </div>
  )
}