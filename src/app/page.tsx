"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, Users, Award, Zap, BarChart2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 to-indigo-900 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="text-white space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Boost Your Community Engagement on Telegram
              </h1>
              <p className="text-xl text-blue-100">
                Our Telegram bot helps projects coordinate campaigns, verify participation, and reward active community members across multiple social platforms.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  onClick={() => router.push('/pricing')}
                  className="bg-white text-blue-900 hover:bg-blue-50"
                >
                  Start Free Trial
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => router.push('/how-it-works')}
                  className="border-white text-white hover:bg-blue-800"
                >
                  How It Works <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="relative h-[400px] rounded-lg overflow-hidden shadow-2xl">
              <Image
                src="/hero-image.png"
                alt="Telegram bot coordinating community engagement"
                fill
                style={{objectFit: 'cover'}}
                className="rounded-lg"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform simplifies cross-platform community coordination for Web3 and crypto projects
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mb-4">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Link Social Accounts</h3>
              <p className="text-gray-700">
                Community members connect their social accounts to your Telegram group. Our bot verifies ownership, establishing a trusted participant base.
              </p>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mb-4">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Create Campaigns</h3>
              <p className="text-gray-700">
                Projects create engagement campaigns with specific goals. Followers can see what actions they need to take to support your project's growth.
              </p>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mb-4">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Track & Reward</h3>
              <p className="text-gray-700">
                Our system automatically tracks participation across platforms and helps you reward engaged community members with non-monetary incentives.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Key Features</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to coordinate campaigns and grow your community
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 mr-4 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Cross-Platform Verification</h3>
                  <p className="text-gray-700">
                    Verify that your community members own the social accounts they claim across X (Twitter), Discord, and Telegram.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 mr-4 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Campaign Coordination</h3>
                  <p className="text-gray-700">
                    Create targeted campaigns for specific social media posts and track engagement metrics automatically.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 mr-4 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Automated Reminders</h3>
                  <p className="text-gray-700">
                    Send automated, friendly reminders to members who haven't participated yet across their preferred platforms.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 mr-4 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Non-Monetary Rewards</h3>
                  <p className="text-gray-700">
                    Recognize and reward active community members with roles, access, recognition, and other non-monetary incentives.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 mr-4 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Analytics Dashboard</h3>
                  <p className="text-gray-700">
                    Gain insights into campaign performance, community growth, and engagement metrics with our detailed analytics.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 mr-4 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Engagement Tracking</h3>
                  <p className="text-gray-700">
                    Automatically track likes, retweets, comments, and other engagement metrics for your social media campaigns.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Why Project Owners Choose Us</h2>
            <p className="mt-4 text-xl text-blue-100 max-w-3xl mx-auto">
              Join hundreds of Web3 projects leveraging our platform for community growth
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-lg bg-blue-800">
              <h3 className="text-xl font-semibold mb-4">Streamlined Community Management</h3>
              <p className="text-blue-100">
                Manage all your community engagement efforts from a single Telegram bot interface, saving time and resources.
              </p>
            </div>

            <div className="p-6 rounded-lg bg-blue-800">
              <h3 className="text-xl font-semibold mb-4">Higher Engagement Rates</h3>
              <p className="text-blue-100">
                Projects using our platform see an average 3x increase in social media engagement through coordinated campaigns.
              </p>
            </div>

            <div className="p-6 rounded-lg bg-blue-800">
              <h3 className="text-xl font-semibold mb-4">Authentic Community Growth</h3>
              <p className="text-blue-100">
                Build a genuine community of verified supporters rather than relying on bots or low-quality engagement.
              </p>
            </div>

            <div className="p-6 rounded-lg bg-blue-800">
              <h3 className="text-xl font-semibold mb-4">Cross-Platform Coordination</h3>
              <p className="text-blue-100">
                Leverage your Telegram community to boost engagement across X (Twitter), Discord, and other platforms.
              </p>
            </div>

            <div className="p-6 rounded-lg bg-blue-800">
              <h3 className="text-xl font-semibold mb-4">Detailed Analytics</h3>
              <p className="text-blue-100">
                Understand what's working and optimize your community strategy with comprehensive performance data.
              </p>
            </div>

            <div className="p-6 rounded-lg bg-blue-800">
              <h3 className="text-xl font-semibold mb-4">Reward Loyal Members</h3>
              <p className="text-blue-100">
                Build community loyalty by recognizing and rewarding your most engaged members automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600">500+</div>
              <div className="mt-2 text-lg text-gray-600">Projects</div>
            </div>

            <div>
              <div className="text-4xl font-bold text-blue-600">1.2M+</div>
              <div className="mt-2 text-lg text-gray-600">Community Members</div>
            </div>

            <div>
              <div className="text-4xl font-bold text-blue-600">12K+</div>
              <div className="mt-2 text-lg text-gray-600">Campaigns Run</div>
            </div>

            <div>
              <div className="text-4xl font-bold text-blue-600">85%</div>
              <div className="mt-2 text-lg text-gray-600">Avg. Participation Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-600 to-blue-700 text-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Boost Your Community Engagement?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Start with our free trial. No credit card required. See how our platform can help grow your community today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => router.push('/pricing')}
              className="bg-white text-blue-700 hover:bg-blue-50"
            >
              Start Free Trial
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push('/contact')}
              className="border-white text-white hover:bg-blue-800"
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Campaign Bot</h3>
              <p className="text-gray-400">
                The ultimate solution for community engagement across social platforms.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/how-it-works" className="hover:text-white">How It Works</Link></li>
                <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link href="/documentation" className="hover:text-white">Documentation</Link></li>
                <li><Link href="/guides" className="hover:text-white">Guides</Link></li>
                <li><Link href="/support" className="hover:text-white">Support</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400">
              © {new Date().getFullYear()} Campaign Bot. All rights reserved.
            </div>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <Link href="#" className="text-gray-400 hover:text-white">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
