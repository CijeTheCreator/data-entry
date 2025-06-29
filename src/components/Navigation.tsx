"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs'
import { Loader2 } from 'lucide-react'

interface NavigationProps {
  variant?: 'default' | 'projects'
}

export default function Navigation({ variant = 'default' }: NavigationProps) {
  const { isSignedIn, isLoaded } = useUser()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        if (window.scrollY > lastScrollY && window.scrollY > 100) {
          // Scrolling down
          setIsVisible(false)
        } else {
          // Scrolling up
          setIsVisible(true)
        }
        setLastScrollY(window.scrollY)
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', controlNavbar)
      return () => {
        window.removeEventListener('scroll', controlNavbar)
      }
    }
  }, [lastScrollY])

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      } flex items-center justify-between px-6 py-4 bg-surface border-b border-gray-200`}>
        <Link href="/" className="flex items-center text-gray-800 hover:text-primary transition-colors">
          <Image
            src="/EntrifyLogo.svg"
            alt="Entrify"
            width={120}
            height={40}
            className="h-8 w-auto"
          />
        </Link>

        <div className="flex items-center space-x-6">
          <Link
            href="/projects"
            className="text-muted hover:text-gray-800 font-medium transition-colors"
          >
            Projects
          </Link>

          {isLoaded ? (
            isSignedIn ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <>
                <SignInButton mode="modal">
                  <button className="text-muted hover:text-gray-800 font-medium transition-colors">
                    Log in
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary transition-colors font-medium">
                    Sign up
                  </button>
                </SignUpButton>
              </>
            )
          ) : (
            <div className="w-8 h-8 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-muted" />
            </div>
          )}
        </div>
      </nav>

      {/* Bolt Badge */}
      <div className="fixed top-20 right-4 z-40">
        <a
          href="https://bolt.new/"
          target="_blank"
          rel="noopener noreferrer"
          className="block transition-transform hover:scale-105"
        >
          <Image
            src="/black_circle_360x360.svg"
            alt="Built with Bolt"
            width={60}
            height={60}
            className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20"
          />
        </a>
      </div>
    </>
  )
}