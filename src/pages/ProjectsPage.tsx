import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import Navigation from '../components/Navigation';

const ProjectsPage: React.FC = () => {
  const [isSignedIn] = useState(true); // Simulate sign-in state

  const mockProjects = [
    {
      id: 1,
      title: 'Invoice Processing Q1',
      thumbnail: 'https://images.pexels.com/photos/8849295/pexels-photo-8849295.jpeg?auto=compress&cs=tinysrgb&w=300&h=200',
      lastEdited: '2 days ago'
    },
    {
      id: 2,
      title: 'Receipt Analysis',
      thumbnail: 'https://images.pexels.com/photos/4386321/pexels-photo-4386321.jpeg?auto=compress&cs=tinysrgb&w=300&h=200',
      lastEdited: '5 days ago'
    },
    {
      id: 3,
      title: 'Contract Documents',
      thumbnail: 'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=300&h=200',
      lastEdited: '1 week ago'
    },
    {
      id: 4,
      title: 'Business Cards Collection',
      thumbnail: 'https://images.pexels.com/photos/7947662/pexels-photo-7947662.jpeg?auto=compress&cs=tinysrgb&w=300&h=200',
      lastEdited: '2 weeks ago'
    },
    {
      id: 5,
      title: 'Financial Reports',
      thumbnail: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=300&h=200',
      lastEdited: '3 weeks ago'
    },
    {
      id: 6,
      title: 'Medical Forms',
      thumbnail: 'https://images.pexels.com/photos/3184639/pexels-photo-3184639.jpeg?auto=compress&cs=tinysrgb&w=300&h=200',
      lastEdited: '1 month ago'
    }
  ];

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
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Sign In
          </button>
        </div>
      </div>
    );
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
            to="/"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create</span>
          </Link>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mockProjects.map((project) => (
            <Link
              key={project.id}
              to={`/processed/${project.id}`}
              className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-200 hover:border-blue-200"
            >
              <div className="aspect-video overflow-hidden">
                <img
                  src={project.thumbnail}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {project.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Edited {project.lastEdited}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {mockProjects.length === 0 && (
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
              to="/"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create Project</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsPage;