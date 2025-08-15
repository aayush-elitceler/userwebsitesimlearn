"use client"
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MessageCircle, RefreshCw, FileText, Lightbulb } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import axios from 'axios'

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

interface PracticeItem {
  label: string;
  type: string;
  payload: {
    questions?: string[];
    quiz_ids?: number[];
    notes?: string[];
  };
}

interface TopicInsightData {
  subject: string;
  concept: string;
  mastery: number;
  attempts: number;
  lastPracticed: string;
  averageTime: string;
  mostCommonMistakes: string[];
  practiceNow: PracticeItem[];
}

function ImprovementPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [data, setData] = useState<TopicInsightData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const topicId = params.subject as string

  // Fetch topic insight data
  useEffect(() => {
    const fetchTopicInsight = async () => {
      try {
        const token = getTokenFromCookie();
        if (!token) {
          setError("Authentication token not found");
          setLoading(false);
          return;
        }

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BASE_URL}/users/personalized-learning/topic/${topicId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.data.success && response.data.data) {
          console.log('📊 Topic Insight Data:', response.data.data);
          setData(response.data.data);
        } else {
          throw new Error(response.data.message || 'Failed to fetch topic insight');
        }
      } catch (err) {
        console.error('Error fetching topic insight:', err);
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.message || err.message || 'An error occurred');
        } else {
          setError(err instanceof Error ? err.message : 'An error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    if (topicId) {
      fetchTopicInsight();
    }
  }, [topicId]);

  const handlePracticeClick = (item: PracticeItem) => {
    if (item.type === 'smart' || item.label.includes('Practice 5 Smart Questions') || item.type === 'retry') {
      // Navigate to practice-sets page with topic data
      const queryParams = new URLSearchParams({
        subject: data?.subject || '',
        concept: data?.concept || '',
        autoGenerate: 'true'
      });
      router.push(`/personalisedLearning/practice-sets?${queryParams.toString()}`);
    } else if (item.type === 'recap') {
      // Navigate to AI chat for quick notes
      router.push('/aichats/chat');
    } else {
      toast({
        title: 'Practice Feature',
        description: `${item.label} - Coming Soon!`,
        duration: 3000,
      });
    }
  };

  const formatLastPracticed = (dateString: string) => {
    if (dateString === "1970-01-01" || !dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading topic insights...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <p className='text-red-600 mb-4'>Error: {error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gray-50 p-6">
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 mt-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="cursor-pointer p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900">
            Improve Your Skill in {data?.concept?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Loading...'}
          </h1>
        </div>
        <Button className="point-ask-gradient cursor-pointer hover:bg-orange-600 text-white flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          Ask AI Chat
        </Button>
      </div>
  
      {/* Skill Summary */}
      <div className="mb-8">
      <Card className="bg-white rounded-lg shadow-sm">
  <CardHeader>
    <CardTitle className="text-xl font-semibold">Skill summary</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 lg:gap-0 justify-between">
      {/* Progress Circle */}
      <div className="flex justify-center lg:w-1/5">
        <div className="relative w-20 h-20">
          <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="3"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#f97316"
              strokeWidth="3"
              strokeDasharray={`${data?.mastery || 0}, 100`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold">{data?.mastery || 0}%</span>
          </div>
        </div>
      </div>

      {/* Stat items */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-200 w-full text-center">
        <div className="px-4">
          <div className="text-sm text-gray-600 border-b pb-1">Attempts</div>
          <div className="text-lg font-bold mt-2">{String(data?.attempts || 0).padStart(2, '0')}</div>
        </div>
        <div className="px-4">
          <div className="text-sm text-gray-600 border-b pb-1">Last practice</div>
          <div className="text-lg font-bold mt-2">{formatLastPracticed(data?.lastPracticed || '')}</div>
        </div>
        <div className="px-4">
          <div className="text-sm text-gray-600 border-b pb-1">Concept</div>
          <div className="text-lg font-bold mt-2">{data?.concept?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Loading...'}</div>
        </div>
        <div className="px-4">
          <div className="text-sm text-gray-600 border-b pb-1">Subject</div>
          <div className="text-lg font-bold mt-2">{data?.subject || 'Loading...'}</div>
        </div>
      </div>
    </div>
  </CardContent>
</Card>

      </div>
  
      {/* Two-column layout for What's Going Wrong and Practice Now */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* What's going wrong */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              What&apos;s going wrong?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {data?.mostCommonMistakes && data.mostCommonMistakes.length > 0 ? (
                data.mostCommonMistakes.map((mistake, index) => (
                  <p key={index} className="text-gray-700">
                    {index + 1}. {mistake}
                  </p>
                ))
              ) : (
                <p className="text-gray-700">No common mistakes data available yet. Keep practicing to get insights!</p>
              )}
              {data?.averageTime && (
                <p className="text-gray-700">
                  Average time per question:{' '}
                  <span className="text-orange-600 font-medium">{data.averageTime}</span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
  
        {/* Practice now */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Practice now</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data?.practiceNow && data.practiceNow.length > 0 ? (
              data.practiceNow.map((item, index) => {
                const hasRefresh = item.type === 'retry';
                const hasNotes = item.type === 'recap';
                
                return (
                  <Button 
                    key={index}
                    className="cursor-pointer w-full h-16 text-lg flex items-center justify-center gap-3 border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white transition-all duration-200"
                    variant="outline"
                    onClick={() => handlePracticeClick(item)}
                  >
                    {hasRefresh && <RefreshCw className="h-5 w-5" />}
                    {hasNotes && <FileText className="h-5 w-5" />}
                    {item.label}
                  </Button>
                );
              })
            ) : (
              <Button 
                className="cursor-pointer w-full h-16 border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white transition-all duration-200 text-lg flex items-center justify-center gap-3"
                variant="outline"
                onClick={() => handlePracticeClick({ label: 'Practice Questions', type: 'general', payload: {} })}
              >
                Practice Questions
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
  <Toaster />
  </>
  )
}

export default ImprovementPage