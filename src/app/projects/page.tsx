'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Loader2 } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import Navigation from '@/components/Navigation'

interface Project {
  id: string
  name: string
  fileUrls: string[]
  status: string
  updatedAt: string
}

export default function ProjectsPage() {
  const { isSignedIn, isLoaded } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchProjects()
    } else if (isLoaded) {
      setIsLoading(false)
    }
  }, [isSignedIn, isLoaded])

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours} hours ago`
    if (diffInHours < 48) return '1 day ago'
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`
    if (diffInHours < 336) return '1 week ago'
    return `${Math.floor(diffInHours / 168)} weeks ago`
  }

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation variant="projects" />
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
        <Navigation variant="projects" />
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Sign in to see your catalog
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Access all your processed documents and projects in one place.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation variant="projects" />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-600 mt-1">Your document processing projects</p>
          </div>
          <Link
            href="/"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create</span>
          </Link>
        </div>

        {/* Projects Grid */}
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/processed/${project.id}`}
                className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-200 hover:border-blue-200"
              >
                <div className="aspect-video overflow-hidden bg-gray-100">
                  {project.fileUrls[0] ? (
                    <Image
                      src={project.fileUrls[0]}
                      alt={project.name}
                      width={300}
                      height={200}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Plus className="w-12 h-12" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {project.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Edited {formatTimeAgo(project.updatedAt)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Plus className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No projects yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first project to get started with document processing.
            </p>
            <Link
              href="/"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create Project</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}