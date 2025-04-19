"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, Users, Award, Zap, BarChart2 } from 'lucide-react';
import { Card } from '@/components/ui/card';


export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Welcome to SocialBoost</h1>
          <p className="text-xl text-gray-300">Amplify your social media campaigns and earn rewards</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card className="p-6 bg-gray-800 border-gray-700">
            <h2 className="text-2xl font-bold mb-4">For Community Members</h2>
            <p className="text-gray-300 mb-6">
              Participate in social media campaigns, earn rewards, and grow your influence.
            </p>
            <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
              <Link href="https://t.me/SocialBoostBot?start=register_member">
                Register as Member
              </Link>
            </Button>
          </Card>

          <Card className="p-6 bg-gray-800 border-gray-700">
            <h2 className="text-2xl font-bold mb-4">For Project Owners</h2>
            <p className="text-gray-300 mb-6">
              Create and manage campaigns, track engagement, and grow your community.
            </p>
            <Button asChild className="w-full bg-green-600 hover:bg-green-700">
              <Link href="https://t.me/SocialBoostBot?start=register_project">
                Register as Project Owner
              </Link>
            </Button>
          </Card>
        </div>

        <div className="text-center">
          <p className="text-gray-400 mb-4">Already registered?</p>
          <Button asChild variant="outline" className="px-8">
            <Link href="https://t.me/SocialBoostBot">Open Bot</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}