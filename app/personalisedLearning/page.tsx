'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useRouter } from 'next/navigation';
import { Star, Users, Target, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import axios from 'axios';

// Utility to get token from 'auth' cookie
function getTokenFromCookie() {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )auth=([^;]*)/);
  if (!match) return null;
  try {
    const decoded = decodeURIComponent(match[1]);
    const parsed = JSON.parse(decoded);
    return parsed.token;
  } catch {
    return null;
  }
}

interface ProgressItem {
  topicId: string;
  subject: string;
  concept: string;
  mastery: number;
  lastPracticed: string;
  attempts: number;
  mostCommonMistakes: string[];
}

interface RecommendedTopic {
  topicId: string;
  subject: string;
  concept: string;
  mastery: number;
  action: string;
}

interface MicroGoal {
  title: string;
  completion: number;
  // Optional quiz wiring
  quizId?: string;
  link?: string;
}

interface PracticeSuggestion {
  label: string;
  type: string;
}

interface PersonalizedLearningData {
  progress: ProgressItem[];
  recommendedTopics: RecommendedTopic[];
  microGoal: MicroGoal;
  practiceSuggestions: PracticeSuggestion[];
}

function PersonalisedLearningPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = useState<PersonalizedLearningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch personalized learning data
  useEffect(() => {
    const fetchPersonalizedLearningData = async () => {
      try {
        const token = getTokenFromCookie();
        if (!token) {
          setError("Authentication token not found");
          setLoading(false);
          return;
        }

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BASE_URL}/users/personalized-learning`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.data.success && response.data.data) {
          console.log('📊 Complete API Response:', response.data);
          console.log('📊 Personalized Learning Data Received:', response.data.data);
          console.log('📈 Progress Items Count:', response.data.data.progress?.length || 0);
          console.log('📈 Progress Items Array:', response.data.data.progress);
          console.log('🎯 Recommended Topics Count:', response.data.data.recommendedTopics?.length || 0);
          console.log('� Recommended Topics Array:', response.data.data.recommendedTopics);
          console.log('�🎪 Practice Suggestions Count:', response.data.data.practiceSuggestions?.length || 0);
          console.log('🎪 Practice Suggestions Array:', response.data.data.practiceSuggestions);
          console.log('🎯 Micro Goal:', response.data.data.microGoal);
          setData(response.data.data);
        } else {
          throw new Error(response.data.message || 'Failed to fetch personalized learning data');
        }
      } catch (err) {
        console.error('Error fetching personalized learning data:', err);
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.message || err.message || 'An error occurred');
        } else {
          setError(err instanceof Error ? err.message : 'An error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPersonalizedLearningData();
  }, []);

  const handleImproveClick = (subject: string, concept: string) => {
    // Create a URL-safe identifier combining subject and concept
    const topicId = `${subject.toLowerCase().replace(/\s+/g, '_')}_${concept.toLowerCase().replace(/\s+/g, '_')}`;
    router.push(`/personalisedLearning/improve/${topicId}`);
  };

  const handlePracticeSetsClick = () => {
    // Navigate to practice-sets page similar to the improvement page
    const queryParams = new URLSearchParams({
      subject: 'General',
      concept: 'Mixed Topics',
      autoGenerate: 'true'
    });
    router.push(`/personalisedLearning/practice-sets?${queryParams.toString()}`);
  };

  // Get top progress items for display - Show all items
  const getTopProgressItems = () => {
    if (!data?.progress || !Array.isArray(data.progress)) {
      console.log('⚠️ No progress data or not an array:', data?.progress);
      return [];
    }
    
    const filteredItems = data.progress
      .filter(item => {
        // Show all items, including those with 0% mastery
        return true;
      })
      .sort((a, b) => {
        const masteryA = Number(a.mastery) || 0;
        const masteryB = Number(b.mastery) || 0;
        return masteryB - masteryA;
      });
      // Removed .slice(0, 5) to show all items
    
    console.log('📈 All Progress Items (showing all):', filteredItems);
    return filteredItems;
  };

  // Get all progress items (for potential future use)
  const getAllProgressItems = () => {
    if (!data?.progress || !Array.isArray(data.progress)) return [];
    return data.progress.sort((a, b) => {
      const masteryA = Number(a.mastery) || 0;
      const masteryB = Number(b.mastery) || 0;
      return masteryB - masteryA;
    });
  };

  const topProgressItems = getTopProgressItems();

  if (loading) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4'></div>
          <p className='text-muted-foreground'>Loading your personalized learning data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <div className='text-center'>
          <p className='text-destructive mb-4'>Error: {error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes bounceInUp {
          0% {
            opacity: 0;
            transform: translateY(50px) scale(0.8);
          }
          60% {
            opacity: 1;
            transform: translateY(-10px) scale(1.05);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: var(--primary) var(--muted);
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: var(--muted);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, var(--primary), var(--primary));
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, var(--primary), var(--primary));
        }

        /* Custom background colors using theme variables */
        .bg-primary-light {
          background-color: color-mix(in srgb, var(--primary) 14%, transparent);
        }

        .bg-primary-lighter {
          background-color: color-mix(in srgb, var(--primary) 25%, transparent);
        }
      `}</style>
      <div className='min-h-screen bg-background p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-4xl font-bold text-foreground mb-2'>
            Your AI-Powered Learning Zone
          </h1>
          <p className='text-xl text-muted-foreground'>
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
                <p className='text-sm text-muted-foreground'>
                  Visualize your skill growth. ({topProgressItems.length} total topics)
                </p>
              </CardHeader>
              <CardContent className='p-6'>
                <div 
                  className='max-h-64 overflow-y-auto scroll-smooth space-y-4 pr-2 custom-scrollbar'
                >
                  {topProgressItems.length > 0 ? (
                    topProgressItems.map((item, index) => (
                      <div
                        key={item.topicId}
                        className='bg-primary-light rounded-lg p-4 hover:bg-primary-lighter transition-all duration-300'
                        style={{ 
                          animationDelay: `${index * 100}ms`,
                          opacity: 0,
                          animation: `fadeInUp 0.6s ease-out ${index * 100}ms forwards`
                        }}
                      >
                        <div className='mb-3'>
                          <h3 className='font-semibold text-card-foreground text-base mb-2'>
                            {item.subject || 'Unknown Subject'} - {item.concept || 'Unknown Concept'}
                          </h3>
                          <div className='w-full mb-2'>
                            <Progress
                              value={Number(item.mastery) || 0}
                              className='h-3 w-full bg-muted'
                            />
                          </div>
                          <span className='text-sm font-medium text-primary'>
                            {Number(item.mastery) || 0}% mastered
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className='bg-primary-light rounded-lg p-4'>
                      <div className='mb-3'>
                        <h3 className='font-semibold text-card-foreground text-base mb-2'>
                          No progress data available
                        </h3>
                        <div className='w-full mb-2'>
                          <Progress value={0} className='h-3 w-full bg-muted' />
                        </div>
                        <span className='text-sm font-medium text-primary'>
                          0% mastered
                        </span>
                      </div>
                    </div>
                  )}
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
                <p className='text-sm text-muted-foreground'>
                  Complete your daily learning goal.
                </p>
              </CardHeader>
              <CardContent className='p-6'>
                <div className='bg-primary-light rounded-lg p-4'>
                  <div className='mb-3'>
                    <h3 className='font-semibold text-card-foreground text-base mb-2'>
                      {data?.microGoal?.title || 'Complete today\'s learning challenge'}
                    </h3>
                    <div className='w-full mb-2'>
                      <Progress value={data?.microGoal?.completion || 0} className='h-3 w-full bg-muted' />
                    </div>
                    <span className='text-sm font-medium text-primary'>
                      {data?.microGoal?.completion || 0}%
                    </span>
                  </div>
                  {(data?.microGoal?.quizId || data?.microGoal?.link) && (
                    <Button
                      className='mt-2 cursor-pointer point-ask-gradient text-white'
                      onClick={() => {
                        const l = data?.microGoal?.link;
                        const qid = data?.microGoal?.quizId || (l && l.includes('/users/quiz-by-id?id=') ? l.split('id=')[1]?.split('&')[0] : undefined);
                        if (qid) return router.push(`/quizes/${qid}/start`);
                        if (l) {
                          if (l.startsWith('http')) window.open(l, '_blank'); else router.push(l);
                        }
                      }}
                    >
                      Start Quiz
                    </Button>
                  )}
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
                <p className='text-sm text-muted-foreground'>
                  Based on your recent performance.
                </p>
              </CardHeader>
              <CardContent className='space-y-4'>
                {data?.recommendedTopics && data.recommendedTopics.length > 0 ? (
                  data.recommendedTopics.map((topic, index) => (
                    <div 
                      key={topic.topicId} 
                      className='flex items-center justify-between p-4 bg-primary-light rounded-lg transition-all duration-300 hover:bg-primary-lighter hover:scale-[1.02] hover:shadow-md'
                      style={{ 
                        animationDelay: `${index * 150}ms`,
                        opacity: 0,
                        animation: `slideInRight 0.6s ease-out ${index * 150}ms forwards`
                      }}
                    >
                      <div className='flex-1 pr-4'>
                        <h3 className='font-medium text-card-foreground text-sm leading-tight'>
                          {topic.subject || 'Unknown Subject'} - {topic.concept || 'Unknown Concept'}
                        </h3>
                        <p className='text-sm text-primary'>{Number(topic.mastery) || 0}% mastered</p>
                      </div>
                      <Button
                        onClick={() => handleImproveClick(topic.subject || 'Unknown', topic.concept || 'Unknown')}
                        className='cursor-pointer point-ask-gradient hover:bg-primary/90 text-white text-sm px-4 py-2'
                      >
                        {topic.action || 'Improve'}
                      </Button>
                    </div>
                  ))
                ) : (
                  <>
                    {/* Fallback content */}
                    <div className='flex items-center justify-between p-4 bg-primary-light rounded-lg'>
                      <div>
                        <h3 className='font-medium text-card-foreground'>
                          No recommendations available
                        </h3>
                        <p className='text-sm text-primary'>Keep learning to get personalized recommendations</p>
                      </div>
                      <Button
                        onClick={() => handleImproveClick('General', 'Learning')}
                        className='cursor-pointer point-ask-gradient hover:bg-primary/90 text-white'
                      >
                        Explore
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Adaptive Practice Sets */}
            <Card>
              <CardHeader>
                <CardTitle className='text-xl font-semibold flex items-center gap-2'>
                  <Users className='h-5 w-5' />
                  Adaptive Practice Sets
                </CardTitle>
                <p className='text-sm text-muted-foreground'>
                  Custom designed for your level.
                </p>
              </CardHeader>
              <CardContent className='space-y-3'>
                <Button
                  className='cursor-pointer w-full point-ask-gradient hover:bg-primary/90 text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg transform'
                  onClick={handlePracticeSetsClick}
                  style={{ 
                    opacity: 0,
                    animation: `bounceInUp 0.8s ease-out forwards`
                  }}
                >
                  Practice
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </div>
      <Toaster />
    </>
  );
}

export default PersonalisedLearningPage;
