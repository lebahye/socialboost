"use client";

import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  const handleRegister = (type: 'member' | 'project') => {
    if (!window.Telegram?.WebApp) {
      window.open(`https://t.me/SocialBoostBot?start=register_${type}`, '_blank');
      return;
    }
    window.Telegram.WebApp.openTelegramLink(`https://t.me/SocialBoostBot?start=register_${type}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black text-white p-4">
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-5xl font-bold mb-6">SocialBoost</h1>
        <p className="text-xl text-gray-300 mb-12">
          Amplify your social media presence and earn rewards
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <Button 
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={() => handleRegister('member')}
          >
            Join as Member <ArrowRight className="ml-2" />
          </Button>

          <Button
            size="lg" 
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={() => handleRegister('project')}
          >
            Register Project <ArrowRight className="ml-2" />
          </Button>
        </div>
      </div>
    </main>
  );
}