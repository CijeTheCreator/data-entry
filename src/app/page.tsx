import Navigation from '@/components/Navigation'
import FileUpload from '@/components/FileUpload'
import Image from 'next/image'

export default function HeroPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 to-indigo-100 py-20 overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-yellow-400 rounded-full opacity-20"></div>
        <div className="absolute bottom-10 left-10 w-24 h-24 bg-blue-400 rounded-full opacity-20"></div>
        
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Data Entry Shouldn't Feel Like Archaeology. We Make It Magic.
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Transform any document into structured data with AI-powered automation. 
              Upload once, extract forever.
            </p>
            <FileUpload />
          </div>
          
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-300">
              <Image
                src="https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt="Document processing visualization"
                width={600}
                height={400}
                className="w-full h-64 object-cover rounded-lg"
              />
              <div className="mt-4">
                <div className="flex space-x-2 mb-3">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-2 bg-blue-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Sections */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Your Handwriting Is Terrible. Our AI Loves It Anyway.
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                While other tools throw tantrums at messy receipts and scribbled notes, we've trained our AI to read everything from doctor prescriptions to napkin sketches. One click, perfect data—no squinting required.
              </p>
            </div>
            <div className="relative">
              <Image
                src="https://images.pexels.com/photos/7947662/pexels-photo-7947662.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt="Handwritten documents"
                width={600}
                height={400}
                className="w-full h-80 object-cover rounded-2xl shadow-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
            <div className="order-2 lg:order-1">
              <Image
                src="https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt="Enterprise tools"
                width={600}
                height={400}
                className="w-full h-80 object-cover rounded-2xl shadow-lg"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Big Tools for Big Companies. Small Tools for Real People.
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Why should Fortune 500s have all the fun? We built enterprise-grade document processing that works just as well for your side hustle, your freelance gig, or your grandma's recipe collection.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Your Phone Takes the Photos. Why Not Do the Work Too?
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Snap receipts at dinner, capture business cards at conferences, record expenses on the go. We live in your pocket because that's where real data collection happens—not chained to a desktop.
              </p>
            </div>
            <div className="relative">
              <Image
                src="https://images.pexels.com/photos/4386321/pexels-photo-4386321.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt="Mobile document capture"
                width={600}
                height={400}
                className="w-full h-80 object-cover rounded-2xl shadow-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <Image
                src="https://images.pexels.com/photos/3184639/pexels-photo-3184639.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt="Time efficiency"
                width={600}
                height={400}
                className="w-full h-80 object-cover rounded-2xl shadow-lg"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Months of Data Entry in Minutes. Math That Actually Matters.
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Stop playing digital archaeology with stacks of documents. Our automation processes hundreds of pages while you grab coffee. Because your time is worth more than manual data entry, and we can prove it with a spreadsheet.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Data Entry?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of professionals who've already automated their document processing.
          </p>
          <FileUpload />
        </div>
      </section>
    </div>
  )
}