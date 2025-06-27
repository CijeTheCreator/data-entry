"use client"

import Link from 'next/link'
import { FileText } from 'lucide-react'
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs'

interface NavigationProps {
  variant?: 'default' | 'projects'
}

export default function Navigation({ variant = 'default' }: NavigationProps) {
  const { isSignedIn } = useUser()

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
      <Link href="/" className="flex items-center space-x-2 text-gray-800 hover:text-blue-600 transition-colors">
        <FileText className="w-8 h-8 text-blue-600" />
        <span className="text-xl font-bold">DataFlow</span>
      </Link>

      <div className="flex items-center space-x-6">
        <Link
          href="/projects"
          className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
        >
          Projects
        </Link>

        {isSignedIn ? (
          <UserButton afterSignOutUrl="/" />
        ) : (
          <>
            <SignInButton mode="modal">
              <button className="text-gray-600 hover:text-gray-800 font-medium transition-colors">
                Log in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Sign up
              </button>
            </SignUpButton>
          </>
        )}
      </div>
    </nav>
  )
}
