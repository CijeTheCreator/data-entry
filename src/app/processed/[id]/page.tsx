'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { CheckCircle, FileText, Headphones, Undo2, Redo2, Download, ChevronDown, X, Mail, Save } from 'lucide-react'
import Navigation from '@/components/Navigation'

export default function ProcessedPage() {
  const params = useParams()
  const [showTextModal, setShowTextModal] = useState(false)
  const [showAudioModal, setShowAudioModal] = useState(false)
  const [showDownloadMenu, setShowDownloadMenu] = useState(false)
  const [textAnalysis, setTextAnalysis] = useState('')
  const [isLoadingText, setIsLoadingText] = useState(false)
  const [isLoadingAudio, setIsLoadingAudio] = useState(false)

  const handleTextAnalysis = async () => {
    setShowTextModal(true)
    setIsLoadingText(true)
    
    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    setTextAnalysis(`# Document Analysis Report

## Document Overview
This appears to be a financial invoice document with the following key characteristics:

### Extracted Information
- **Document Type**: Invoice
- **Invoice Number**: INV-2024-001
- **Date**: March 15, 2024
- **Total Amount**: $2,450.00
- **Vendor**: TechCorp Solutions
- **Client**: DataFlow Systems

### Key Data Points
- **Line items**: 5 products/services identified
- **Tax amount**: $245.00 (10%)
- **Payment terms**: Net 30 days
- **Currency**: USD

### Data Quality Score
- **Completeness**: 95%
- **Confidence**: 92%
- **Accuracy**: 98%

### Recommendations
1. All critical financial data successfully extracted
2. Consider automating similar invoice processing
3. Setup recurring processing for this vendor type

This document has been successfully processed and is ready for integration into your financial management system.`)
    
    setIsLoadingText(false)
  }

  const handleAudioAnalysis = async () => {
    setShowAudioModal(true)
    setIsLoadingAudio(true)
    
    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 2500))
    
    setIsLoadingAudio(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <span className="text-lg font-medium text-gray-800">Synced with Google Sheets</span>
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
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center space-x-2">
                    <span>CSV</span>
                  </button>
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center space-x-2">
                    <span>JSON</span>
                  </button>
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center space-x-2">
                    <span>XLS</span>
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
              <Image
                src="https://images.pexels.com/photos/8849295/pexels-photo-8849295.jpeg?auto=compress&cs=tinysrgb&w=800&h=450"
                alt="Processed document"
                width={800}
                height={450}
                className="w-full h-full object-cover"
              />
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
              </div>
            </div>

            {/* Document Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Document Details</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">File Name:</span>
                  <span className="font-medium">invoice_march_2024.pdf</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Processed:</span>
                  <span className="font-medium">2 minutes ago</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="text-green-600 font-medium">Complete</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Data Points:</span>
                  <span className="font-medium">47 extracted</span>
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

            {!isLoadingText && (
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
                    <audio controls className="w-full">
                      <source src="https://www.soundjay.com/misc/sounds/bell-ringing-05.wav" type="audio/wav" />
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

            {!isLoadingAudio && (
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