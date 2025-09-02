'use client';

import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ExamViolationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToExam?: () => void;
  onBackToDashboard?: () => void;
  violationType: 'warning' | 'exceeded';
  warningCount?: number;
  maxWarnings?: number;
}

const ExamViolationModal: React.FC<ExamViolationModalProps> = ({
  isOpen,
  onClose,
  onBackToExam,
  onBackToDashboard,
  violationType,
  warningCount = 1,
  maxWarnings = 3,
}) => {
  const isWarning = violationType === 'warning';
  const isExceeded = violationType === 'exceeded';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl border-0 p-0 overflow-hidden"
        style={{
          fontFamily: 'Poppins, sans-serif',
        }}
      >
        <div className="p-8 text-center space-y-6">
          {/* Icon and Title */}
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="text-red-500"
              >
                <path 
                  d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            
            <h2 
              className="text-gray-900"
              style={{
                fontFamily: 'Poppins',
                fontWeight: 700,
                fontSize: '18px',
                lineHeight: '25.55px',
                letterSpacing: '0%',
                textAlign: 'center',
              }}
            >
              🛑 {isWarning ? "You've Left the Exam Screen" : "You've exceeded the allowed number of screen violations."}
            </h2>
          </div>

          {/* Content */}
          <div className="space-y-4">
            <p 
              className="text-gray-700"
              style={{
                fontFamily: 'Poppins',
                fontWeight: 400,
                fontSize: '14px',
                lineHeight: '20px',
                textAlign: 'center',
              }}
            >
              {isWarning 
                ? "To maintain exam integrity, please stay on this page."
                : "Your exam has been submitted automatically due to repeated tab switches or screen exits."
              }
            </p>

            {isWarning && (
              <p 
                className="text-red-600"
                style={{
                  fontFamily: 'Poppins',
                  fontWeight: 700,
                  fontSize: '16px',
                  lineHeight: '22px',
                  textAlign: 'center',
                }}
              >
                This is Warning {warningCount} of {maxWarnings}.
              </p>
            )}

            {isWarning && (
              <p 
                className="text-gray-600"
                style={{
                  fontFamily: 'Poppins',
                  fontWeight: 400,
                  fontSize: '14px',
                  lineHeight: '20px',
                  textAlign: 'center',
                }}
              >
                If you switch again, the exam may be auto-submitted.
              </p>
            )}
          </div>

          {/* Action Button */}
          <div className="pt-2">
            {isWarning ? (
              <Button
                onClick={onBackToExam}
                className="w-full bg-gradient-to-r from-[#006a3d] to-[#006a3d] hover:from-[#005030] hover:to-[#005030] text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                style={{
                  fontFamily: 'Poppins',
                  fontWeight: 600,
                  fontSize: '16px',
                }}
              >
                Back to exam
              </Button>
            ) : (
              <Button
                onClick={onBackToDashboard}
                className="w-full bg-gradient-to-r from-[#006a3d] to-[#006a3d] hover:from-[#005030] hover:to-[#005030] text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                style={{
                  fontFamily: 'Poppins',
                  fontWeight: 600,
                  fontSize: '16px',
                }}
              >
                Back to dashboard
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExamViolationModal;
