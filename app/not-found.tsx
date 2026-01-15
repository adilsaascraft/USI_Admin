'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

export default function NotFoundPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center min-h-screen bg-white p-6 text-center"
    >
      {/* Image */}
      <div className="w-[350px] h-[60vh] relative mb-8">
        <Image
          src="https://res.cloudinary.com/dymanaa1j/image/upload/v1757228277/not-found-image_uxn2ig.png"
          alt="404 Not Found"
          fill
          className="object-fit"
          priority
        />
      </div>

      {/* Message */}
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Page Not Found</h1>
      <p className="text-gray-600 max-w-md mb-6">
        Oops! The page you are looking for does not exist or has been moved.
      </p>

      {/* Back Button */}
      <Link href="/dashboard">
        <Button
          variant="secondary"
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          ← Back To Dashbaord
        </Button>
      </Link>
    </motion.div>
  )
}
