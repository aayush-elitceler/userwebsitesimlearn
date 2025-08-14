'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useRouter } from 'next/navigation';
import { Star, Users, Target, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

function PersonalisedLearningPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleImproveClick = (subject: string) => {
    toast({
      title: 'Coming Soon!',
      description: `${subject} improvement feature is under development.`,
      duration: 3000,
    });
  };

  const handlePracticeSetsClick = () => {
    toast({
      title: 'Coming Soon!',
      description: 'Practice sets feature is under development.',
      duration: 3000,
    });
  };

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-4xl font-bold text-gray-900 mb-2'>
            Your AI-Powered Learning Zone
          </h1>
          <p className='text-xl text-gray-600'>
            AI-powered preparation to help you perform your best.
          </p>
        </div>

        <div className='grid lg:grid-cols-2 gap-8'>
          {/* Left Column - Progress Tracking */}
          <div className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='text-xl font-semibold flex items-center gap-2'>
                  <TrendingUp className='h-5 w-5' />
                  Track your progress
                </CardTitle>
                <p className='text-sm text-gray-600'>
                  Visualize your skill growth.
                </p>
              </CardHeader>
              <CardContent className='space-y-6 bg-[#FF9E2714] p-4 rounded-md'>
                {/* Grammar - Tenses */}
                <div className='space-y-2 '>
                  <div className='flex justify-between items-center'>
                    <h3 className='font-medium text-gray-900'>
                      Grammar - Tenses
                    </h3>
                    <span className='text-sm text-orange-600 font-medium'>
                      46% mastered
                    </span>
                  </div>
                  <Progress value={46} className='h-3' />
                </div>

                {/* Science - Biology */}
                <div className='space-y-2'>
                  <div className='flex justify-between items-center'>
                    <h3 className='font-medium text-gray-900'>
                      Science - Biology
                    </h3>
                    <span className='text-sm text-orange-600 font-medium'>
                      72% mastered
                    </span>
                  </div>
                  <Progress value={72} className='h-3' />
                </div>
              </CardContent>
            </Card>

            {/* Today's Micro-Goal */}
            <Card>
              <CardHeader>
                <CardTitle className='text-xl font-semibold flex items-center gap-2'>
                  <Target className='h-5 w-5' />
                  Today&apos;s Micro-Goal
                </CardTitle>
                <p className='text-sm text-gray-600'>
                  Complete your daily learning goal.
                </p>
              </CardHeader>
              <CardContent>
                <div className='space-y-3  bg-[#FF9E2714] p-4 rounded-md'>
                  <h3 className='font-medium text-gray-900'>
                    Practice your Maths - Tables
                  </h3>
                  <Progress value={0} className='h-2' />
                  <span className='text-sm text-gray-600'>0%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Recommendations & Practice */}
          <div className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='text-xl font-semibold flex items-center gap-2'>
                  <Star className='h-5 w-5' />
                  Recommended topic
                </CardTitle>
                <p className='text-sm text-gray-600'>
                  Based on your recent performance.
                </p>
              </CardHeader>
              <CardContent className='space-y-4 '>
                {/* Grammar - Tenses Recommendation */}
                <div className='flex items-center justify-between p-4 bg-[#FF9E2714] rounded-lg'>
                  <div>
                    <h3 className='font-medium text-gray-900'>
                      Grammar - Tenses
                    </h3>
                    <p className='text-sm text-orange-600'>46% mastered</p>
                  </div>
                  <Button
                    onClick={() => handleImproveClick('Grammar - Tenses')}
                    className='cursor-pointer point-ask-gradient hover:bg-orange-600 text-white'
                  >
                    Improve
                  </Button>
                </div>

                {/* Science - Biology Recommendation */}
                <div className='flex items-center justify-between p-4 bg-[#FF9E2714] rounded-lg'>
                  <div>
                    <h3 className='font-medium text-gray-900'>
                      Science - Biology
                    </h3>
                    <p className='text-sm text-orange-600'>72% mastered</p>
                  </div>
                  <Button
                    onClick={() => handleImproveClick('Science - Biology')}
                    className='cursor-pointer point-ask-gradient hover:bg-orange-600 text-white'
                  >
                    Improve
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Adaptive Practice Sets */}
            <Card>
              <CardHeader>
                <CardTitle className='text-xl font-semibold flex items-center gap-2'>
                  <Users className='h-5 w-5' />
                  Adaptive Practice Sets
                </CardTitle>
                <p className='text-sm text-gray-600'>
                  Custom designed for your level.
                </p>
              </CardHeader>
              <CardContent>
                <Button
                  className='cursor-pointer w-full point-ask-gradient hover:bg-orange-600 text-white'
                  onClick={handlePracticeSetsClick}
                >
                  Create practice set
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
}

export default PersonalisedLearningPage;
