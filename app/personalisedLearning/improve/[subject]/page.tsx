"use client"
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MessageCircle, RefreshCw, FileText, Lightbulb } from 'lucide-react'
import { useRouter } from 'next/navigation'

function GrammarTensesImprovementPage() {
  const router = useRouter()

  return (
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
            Improve Your Skill in Tenses
          </h1>
        </div>
        <Button className="point-ask-gradient cursor-pointer hover:bg-orange-600 text-white flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          Ask AI Chat
        </Button>
      </div>
  
      {/* ✅ Full-width Skill Summary */}
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
              strokeDasharray="43, 100"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold">43%</span>
          </div>
        </div>
      </div>

      {/* Stat items */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-200 w-full text-center">
        <div className="px-4">
          <div className="text-sm text-gray-600 border-b pb-1">Attempts</div>
          <div className="text-lg font-bold mt-2">05</div>
        </div>
        <div className="px-4">
          <div className="text-sm text-gray-600 border-b pb-1">Last practice</div>
          <div className="text-lg font-bold mt-2">3 days ago</div>
        </div>
        <div className="px-4">
          <div className="text-sm text-gray-600 border-b pb-1">Concept</div>
          <div className="text-lg font-bold mt-2">Tenses</div>
        </div>
        <div className="px-4">
          <div className="text-sm text-gray-600 border-b pb-1">Subject</div>
          <div className="text-lg font-bold mt-2">English</div>
        </div>
      </div>
    </div>
  </CardContent>
</Card>

      </div>
  
      {/* ✅ Two-column layout for What's Going Wrong and Practice Now */}
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
              <p className="text-gray-700">
                1. Most common mistakes: &apos;Confusing{' '}
                <span className="text-orange-600 font-medium">Past Perfect</span> with{' '}
                <span className="text-orange-600 font-medium">Present Perfect</span>&apos;
              </p>
              <p className="text-gray-700">
                2. Average time per question:{' '}
                <span className="text-orange-600 font-medium">18s</span>
              </p>
              <p className="text-gray-700">
                3. Using{' '}
                <span className="text-orange-600 font-medium">Present Tense</span> when{' '}
                <span className="text-orange-600 font-medium">Past Continuous</span> is needed
              </p>
              <p className="text-gray-700">
                4. Missing{' '}
                <span className="text-orange-600 font-medium">auxiliary verb</span> in Past Perfect sentences
              </p>
              <p className="text-gray-700">
                5. Incorrect{' '}
                <span className="text-orange-600 font-medium">word order</span> in negative tense constructions
              </p>
            </div>
          </CardContent>
        </Card>
  
        {/* Practice now */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Practice now</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="cursor-pointer w-full h-16 point-ask-gradient hover:bg-orange-600 text-white text-lg flex items-center justify-center gap-3"
              onClick={() => router.push('/personalisedLearning/practice/smart-questions')}
            >
              Practice 5 Smart Questions
            </Button>
            <Button 
              variant="outline"
              className="cursor-pointer w-full h-16 border-orange-500 text-orange-600 hover:bg-orange-50 text-lg flex items-center justify-center gap-3"
              onClick={() => router.push('/personalisedLearning/practice/retry-incorrect')}
            >
              <RefreshCw className="h-5 w-5" />
              Retry Incorrect Questions
            </Button>
            <Button 
              variant="outline"
              className="cursor-pointer w-full h-16 border-orange-500 text-orange-600 hover:bg-orange-50 text-lg flex items-center justify-center gap-3"
              onClick={() => router.push('/personalisedLearning/notes/tenses')}
            >
              <FileText className="h-5 w-5" />
              Quick Notes Recap
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
  
  )
}

export default GrammarTensesImprovementPage