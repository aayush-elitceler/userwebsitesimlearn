'use client';
import { Sidebar, SidebarContent } from '@/components/ui/sidebar';
import { SidebarHeader } from '@/components/SidebarHeader';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import Logo from '@/public/images/logoAiDash.svg';
import book from '@/public/images/book.png';
import quizWhite from '@/public/images/quiz.svg';
import { LayoutDashboard } from 'lucide-react';
import { Pointer } from 'lucide-react';

import projectsWhite from '@/public/images/project.svg';
import progressWhite from '@/public/images/progress.svg';
import examsWhite from '@/public/images/exams.svg';
import { Nunito_Sans } from 'next/font/google';
import { MicIcon } from 'lucide-react';
import '../app/globals.css';

const DashboardIcon = ({ color = '#222' }) => (
  <LayoutDashboard style={{ color }} />
);

const nunitoSans = Nunito_Sans({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
});

interface AppSidebarProps {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

const ChevronUpDownIcon = ({ open }: { open: boolean }) => (
  <svg
    width='20'
    height='20'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    viewBox='0 0 24 24'
  >
    {
      open ? (
        <path d='M6 15l6-6 6 6' /> // Up
      ) : (
        <path d='M6 9l6 6 6-6' />
      ) // Down
    }
  </svg>
);
const ChatIcon = () => (
  <svg
    width='20'
    height='20'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    viewBox='0 0 24 24'
  >
    <path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' />
  </svg>
);
const AiIcon = () => (
  <div className='w-7 h-7 rounded border-2 border-white flex items-center justify-center  '>
    <span className='text-xs font-bold text-white'>AI</span>
  </div>
);

const aiTutorSubRoutes = [
  {
    label: 'AI Tutor Voice',
    href: '/aichats/voice',
    icon: <MicIcon />,
    bg: 'bg-[rgba(255,255,255,0.5)]',
  },
  {
    label: 'AI Tutor Chat',
    href: '/aichats/chat',
    icon: <ChatIcon />,
    bg: 'point-ask-gradient border-t border-white/30',
  },
];
const pointAskSubRoutes = [
  {
    label: 'Point & Ask Voice',
    href: '/pointask/voice',
    icon: <MicIcon />,
    bg: 'point-ask-gradient',
  },
  {
    label: 'Point & Ask Chat',
    href: '/pointask/chat',
    icon: <ChatIcon />,
    bg: 'bg-[#5B5E6D] border-t border-white/30',
  },
];
const quizSubRoutes = [
  {
    label: 'Take a Quiz',
    href: '/quizes',
    icon: quizWhite,
    bg: 'bg-[#5B5E6D] border-t border-white/30',
  },
  {
    label: 'Generate Quiz',
    href: '/quizes/takeQuiz',
    icon: quizWhite,
    bg: 'point-ask-gradient border-t border-white/30',
  },
];
const examSubRoutes = [
  {
    label: 'Exam Preparation',
    href: '/exams',
    icon: examsWhite,
    bg: 'bg-[#5B5E6D] border-t border-white/30',
  },
  {
    label: 'Take Exam',
    href: '/exams/generate',
    icon: examsWhite,
    bg: 'point-ask-gradient border-t border-white/30',
  },
];
const projectSubRoutes = [
  {
    label: 'Create Projects',
    href: '/projects',
    icon: projectsWhite,
    bg: 'bg-[#5B5E6D] border-t border-white/30',
  },
  {
    label: 'Projects',
    href: '/projects/teacherproject',
    icon: projectsWhite,
    bg: 'point-ask-gradient border-t border-white/30',
  },
];

export function AppSidebar({ collapsed, setCollapsed }: AppSidebarProps) {
  const pathname = usePathname();

  // Admin avatar and name state

  // useEffect(() => {
  //   const fetchAdmin = async () => {
  //     try {
  //       const token = Cookies.get("token");
  //       const res = await fetch(
  //         `${process.env.NEXT_PUBLIC_BASE_URL}/admin/profile`,
  //         {
  //           headers: {
  //             Authorization: `Bearer ${token}`,
  //           },
  //         }
  //       );
  //       if (!res.ok) throw new Error("Failed to fetch admin profile");
  //       const data = await res.json();
  //       const name = data.admin?.name || "";
  //       if (name.length > 0) {
  //       }
  //     } catch (err) {
  //       console.log(err);
  //     }
  //   };
  //   fetchAdmin();
  // }, []);

  const data = {
    items: [
      {
        title: 'Dashboard',
        url: '/',
        icon: DashboardIcon,
      },
      {
        title: 'AI Tutor Chats',
        url: '/aichats',
        icon: book,
      },
      {
        title: 'Take a Quiz',
        url: '/quizes',
        icon: quizWhite,
      },
      {
        title: 'Generate Quiz',
        url: '/quizes/takeQuiz',
        icon: quizWhite,
      },
      {
        title: 'Personalised learning',
        url: '/personalisedLearning',
        icon: projectsWhite,
      },
      {
        title: 'Progress',
        url: '/progress',
        icon: progressWhite,
      },
      
    ],
    navMain2: [
      {
        title: 'Logo',
        url: '/', // Updated URL
        icon: Logo, // Image icon
        isActive: true,
      },
    ],
  };

  const [aiOpen, setAiOpen] = useState(false);
  const [pointOpen, setPointOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [examOpen, setExamOpen] = useState(false);
  const [projectsOpen, setProjectOpen] = useState(false);

  // Close dropdowns when route changes
  useEffect(() => {
    setAiOpen(false);
    setPointOpen(false);
    setQuizOpen(false);
    setExamOpen(false);
    setProjectOpen(false);
  }, [pathname]);

  // Close dropdowns when sidebar collapses
  useEffect(() => {
    if (collapsed) {
      setAiOpen(false);
      setPointOpen(false);
      setQuizOpen(false);
      setExamOpen(false);
      setProjectOpen(false);
    }
  }, [collapsed]);

  // Close dropdowns when sidebar collapses
  useEffect(() => {
    if (collapsed) {
      setAiOpen(false);
      setPointOpen(false);
      setQuizOpen(false);
      setExamOpen(false);
      setProjectOpen(false);
    }
  }, [collapsed]);

  // Check if any sub-section is active
  const isAiTutorActive = aiTutorSubRoutes.some((r) => pathname === r.href);
  const isPointAskActive = pointAskSubRoutes.some((r) => pathname === r.href);
  const isQuizActive = quizSubRoutes.some((r) => pathname === r.href);
  const isExamActive = examSubRoutes.some((r) => pathname === r.href);
  const isProjectsActive = projectSubRoutes.some((r) => pathname === r.href);

  const [mobileOpen, setMobileOpen] = useState(false);
  console.log(mobileOpen);

  return (
    <div >
      {/* Mobile Hamburger Button */}
      <button
        className='lg:hidden fixed top-4 left-4 z-50 point-ask-gradient text-black rounded-full p-2 shadow-lg focus:outline-none'
        onClick={() => setMobileOpen(true)}
        aria-label='Open sidebar'
      >
        <svg
          width='28'
          height='28'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          viewBox='0 0 24 24'
        >
          <path d='M4 6h16M4 12h16M4 18h16' />
        </svg>
      </button>

      {/* Overlay and Sidebar for mobile */}
      {mobileOpen && (
        <>
          <div
            className='fixed  lg:hidden'
            onClick={() => setMobileOpen(false)}
          />{' '}
          <SidebarContent
            className={`bg-white h-screen fixed left-0 top-0 z-[9999] transition-transform duration-300 flex flex-col justify-between w-64 overflow-hidden
            ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:hidden
            ${nunitoSans.className} overflow-y-auto scrollbar-hide`}
            style={{ width: '16rem', minWidth: '16rem', maxWidth: '16rem' }}
          >
            <div>
              <SidebarHeader items={data.navMain2} />
              {/* Mobile close button */}
              <button
                onClick={() => setMobileOpen(false)}
                className='absolute top-7 right-4 z-[101] bg-white rounded-full shadow hover:bg-gray-100 transition'
                aria-label='Close sidebar'
              >
                <svg
                  width='24'
                  height='24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                >
                  <path d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
              {/* Sidebar nav/menu items (same as desktop) */}
              <nav className='flex flex-col flex-1 space-y-2 mt-4 px-4 overflow-y-auto scrollbar-hide pb-4'>
                {/* Section Heading */}
                <div className='pt-2 pb-3'>
                  <span className='text-xs text-gray-400 font-medium uppercase tracking-wider'>
                    For students
                  </span>
                  <div className='border-b border-gray-700 mt-3' />
                </div>
                {/* Dashboard */}
                <div className='relative'>
                  {' '}
                  {pathname === '/' && (
                    <div className='sidebar-indicator sidebar-indicator-dashboard'></div>
                  )}{' '}
                  <Link
                    href='/'
                    className={`flex items-center gap-3 py-3 px-4 rounded-md font-medium transition-all duration-200 relative ${
                      pathname === '/'
                        ? 'bg-gradient-to-r from-[#FFB31F] to-[#FF4949] text-white shadow-sm'
                        : 'text-[#222] hover:bg-[#FFB12133]'
                    }`}
                  >
                    {' '}
                    <DashboardIcon color={pathname === '/' ? '#fff' : '#222'} />{' '}
                    <span className='text-sm'>Dashboard</span>{' '}
                  </Link>{' '}
                </div>
                {/* AI Tutor Dropdown */}
                <div className='mb-2'>
                  <div className='relative'>
                    {isAiTutorActive && (
                      <div className='sidebar-indicator sidebar-indicator-ai-tutor'></div>
                    )}
                    <button
                      onClick={() => setAiOpen(!aiOpen)}
                      className={`w-full flex items-center justify-between py-3 px-4 rounded-md font-medium transition-all duration-200 ${
                        isAiTutorActive
                          ? 'point-ask-gradient text-white shadow-sm'
                          : 'text-white hover:bg-white/10'
                      }`}
                    >
                      <span className='flex items-center gap-3'>
                        {/* <MicIcon style={{ color: isAiTutorActive ? '#fff' : '#222' }} /> */}
                        <span className='text-sm'>AI Tutor</span>
                      </span>
                      <ChevronUpDownIcon open={aiOpen || isAiTutorActive} />
                    </button>
                  </div>
                  {(aiOpen || isAiTutorActive) && (
                    <div className='ml-6 mt-3 flex flex-col gap-2'>
                      {aiTutorSubRoutes.map((sub) => {
                        const isSubActive = pathname === sub.href;
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={`flex items-center gap-3 px-4 mb-1 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                              isSubActive
                                ? 'bg-[#FFB12133] text-[#FF4949]'
                                : 'text-[#222] hover:bg-[#FFB12133]'
                            }`}
                          >
                            <div className='flex-shrink-0'>{sub.icon}</div>
                            <span>{sub.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
                {/* Point & Ask Dropdown */}
                <div className='mb-2'>
                  <div className='relative'>
                    {isPointAskActive && (
                      <div className='sidebar-indicator sidebar-indicator-point-ask'></div>
                    )}
                    <button
                      onClick={() => setPointOpen(!pointOpen)}
                      className={`w-full flex items-center justify-between py-3 px-4 rounded-md font-medium transition-all duration-200 ${
                        isPointAskActive
                          ? 'point-ask-gradient text-white shadow-sm'
                          : 'text-white hover:bg-white/10'
                      }`}
                    >
                      <span className='flex items-center gap-3'>
                      
                        <span className='text-sm'>Point & Ask</span>
                      </span>
                      <ChevronUpDownIcon open={pointOpen || isPointAskActive} />
                    </button>
                  </div>
                  {(pointOpen || isPointAskActive) && (
                    <div className='ml-6 mt-3 flex flex-col gap-2'>
                      {pointAskSubRoutes.map((sub) => {
                        const isSubActive = pathname === sub.href;
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={`flex items-center gap-3 px-4 mb-1 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                              isSubActive
                                ? 'bg-[#FFB12133] text-[#FF4949]'
                                : 'text-[#222] hover:bg-[#FFB12133]'
                            }`}
                          >
                            <div className='flex-shrink-0'>{sub.icon}</div>
                            <span>{sub.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
                {/* Quiz Dropdown */}
                <div className='mb-2'>
                  <div className='relative'>
                    {isQuizActive && (
                      <div className='sidebar-indicator sidebar-indicator-quiz'></div>
                    )}
                    <button
                      onClick={() => setQuizOpen(!quizOpen)}
                      className={`w-full flex items-center justify-between py-3 px-4 rounded-md font-medium transition-all duration-200 ${
                        isQuizActive
                          ? 'point-ask-gradient text-white shadow-sm'
                          : 'text-white hover:bg-white/10'
                      }`}
                    >
                      <span className='flex items-center gap-3'>
                        <Image
                          src={quizWhite}
                          alt='Quiz'
                          width={20}
                          height={20}
                          className={`h-5 w-5 flex-shrink-0 ${isQuizActive ? '' : 'brightness-0'}`}
                        />
                        <span className='text-sm'>Quizzes</span>
                      </span>
                      <ChevronUpDownIcon open={quizOpen || isQuizActive} />
                    </button>
                  </div>
                  {(quizOpen || isQuizActive) && (
                    <div className='ml-6 mt-3 flex flex-col gap-2'>
                      {quizSubRoutes.map((sub) => {
                        const isSubActive = pathname === sub.href;
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={`flex items-center gap-3 px-4 mb-1 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                              isSubActive
                                ? 'bg-[#FFB12133] text-[#FF4949]'
                                : 'text-[#222] hover:bg-[#FFB12133]'
                            }`}
                          >
                            <Image
                              src={sub.icon}
                              alt={sub.label}
                              width={20}
                              height={20}
                              className={`h-5 w-5 flex-shrink-0 ${isSubActive ? '' : 'brightness-0'}`}
                            />
                            <span>{sub.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                  {(quizOpen || isQuizActive) && (
                    <div className='ml-6 mt-3 flex flex-col gap-2'>
                      {quizSubRoutes.map((sub) => {
                        const isSubActive = pathname === sub.href;
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={`flex items-center gap-3 px-4 mb-1 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                              isSubActive
                                ? 'bg-[#FFB12133] text-[#FF4949]'
                                : 'text-[#222] hover:bg-[#FFB12133]'
                            }`}
                          >
                            <Image
                              src={sub.icon}
                              alt={sub.label}
                              width={20}
                              height={20}
                              className={`h-5 w-5 flex-shrink-0 ${isSubActive ? '' : 'brightness-0'}`}
                            />
                            <span>{sub.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
                {/* Exam Dropdown */}
                <div className='mb-2'>
                  <div className='relative'>
                    {isExamActive && (
                      <div className='sidebar-indicator sidebar-indicator-quiz'></div>
                    )}
                    <button
                      onClick={() => setExamOpen(!examOpen)}
                      className={`w-full flex items-center justify-between py-3 px-4 rounded-md font-medium transition-all duration-200 ${
                        isExamActive
                          ? 'point-ask-gradient text-white shadow-sm'
                          : 'text-white hover:bg-white/10'
                      }`}
                    >
                      <span className='flex items-center gap-3'>
                        <Image
                          src={examsWhite}
                          alt='Exams'
                          width={20}
                          height={20}
                          className={`h-5 w-5 flex-shrink-0 ${isExamActive ? '' : 'brightness-0'}`}
                        />
                        <span className='text-sm'>Exams</span>
                      </span>
                      <ChevronUpDownIcon open={examOpen || isExamActive} />
                    </button>
                  </div>
                  {(examOpen || isExamActive) && (
                    <div className='ml-6 mt-3 flex flex-col gap-2'>
                      {examSubRoutes.map((sub) => {
                        const isSubActive = pathname === sub.href;
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={`flex items-center gap-3 px-4 mb-1 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                              isSubActive
                                ? 'bg-[#FFB12133] text-[#FF4949]'
                                : 'text-[#222] hover:bg-[#FFB12133]'
                            }`}
                          >
                            <Image
                              src={sub.icon}
                              alt={sub.label}
                              width={20}
                              height={20}
                              className={`h-5 w-5 flex-shrink-0 ${isSubActive ? '' : 'brightness-0'}`}
                            />
                            <span>{sub.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                 
                </div>
                <div className='mb-2'>
                  <div className='relative'>
                    {isExamActive && (
                      <div className='sidebar-indicator sidebar-indicator-quiz'></div>
                    )}
                    <button
                      onClick={() => setExamOpen(!examOpen)}
                      className={`w-full flex items-center justify-between py-3 px-4 rounded-md font-medium transition-all duration-200 ${
                        isExamActive
                          ? 'point-ask-gradient text-white shadow-sm'
                          : 'text-white hover:bg-white/10'
                      }`}
                    >
                      <span className='flex items-center gap-3'>
                        <Image
                          src={examsWhite}
                          alt='Exams'
                          width={20}
                          height={20}
                          className={`h-5 w-5 flex-shrink-0 ${isExamActive ? '' : 'brightness-0'}`}
                        />
                        <span className='text-sm'>Exams</span>
                      </span>
                      <ChevronUpDownIcon open={examOpen || isExamActive} />
                    </button>
                  </div>
                  {(examOpen || isExamActive) && (
                    <div className='ml-6 mt-3 flex flex-col gap-2'>
                      {examSubRoutes.map((sub) => {
                        const isSubActive = pathname === sub.href;
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={`flex items-center gap-3 px-4 mb-1 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                              isSubActive
                                ? 'bg-[#FFB12133] text-[#FF4949]'
                                : 'text-[#222] hover:bg-[#FFB12133]'
                            }`}
                          >
                            <Image
                              src={sub.icon}
                              alt={sub.label}
                              width={20}
                              height={20}
                              className={`h-5 w-5 flex-shrink-0 ${isSubActive ? '' : 'brightness-0'}`}
                            />
                            <span>{sub.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                 
                </div>
                {/* Other menu items */}
                {data.items
                  .filter(
                    (item) =>
                      item.title !== 'Take a Quiz' &&
                      item.title !== 'Generate Quiz'
                    
                  )
                  .slice(2)
                  .map((item, index) => {
                    const isActive = pathname === item.url;
                    const indicatorClasses = [
                      'sidebar-indicator-quiz',
                      'sidebar-indicator-projects',
                      'sidebar-indicator-progress',
                      'sidebar-indicator-exams',
                    ];
                    return (
                      <div key={item.title} className='relative'>
                        {isActive && (
                          <div
                            className={`sidebar-indicator ${indicatorClasses[index]}`}
                          ></div>
                        )}
                        <Link
                          href={item.url}
                          className={`flex items-center gap-3 py-3 px-4 rounded-md font-medium transition-all duration-200 ${
                            isActive
                              ? 'bg-gradient-to-r from-[#FFB31F] to-[#FF4949] text-white shadow-sm'
                              : 'text-[#222] hover:bg-[#FFB12133]'
                          }`}
                        >
                          <Image
                            src={item.icon}
                            alt={item.title}
                            className={`h-5 w-5 flex-shrink-0 ${isActive ? '' : 'brightness-0'}`}
                          />
                          <span className='text-sm'>{item.title}</span>
                        </Link>
                      </div>
                    );
                  })}
                {/* Section Heading for Corporates */}
                <div className='pt-6 pb-3'>
                  <span className='text-xs text-gray-400 font-medium uppercase tracking-wider'>
                    For Corporates
                  </span>
                  <div className='border-b border-gray-700 mt-3' />
                </div>
                {/* Example corporate links */}
                <div className='relative'>
                  {pathname === '/mock-interview' && (
                    <div className='sidebar-indicator sidebar-indicator-mock'></div>
                  )}
                  <Link
                    href='/mock-interview'
                    className={`flex items-center gap-3 py-3 px-4 rounded-md font-medium transition-all duration-200 ${
                      pathname === '/mock-interview'
                        ? 'point-ask-gradient text-white shadow-sm'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <Image
                      src='/images/speechmock.svg'
                      alt='Mock Interview'
                      width={20}
                      height={20}
                      className={`h-5 w-5 flex-shrink-0 ${pathname === '/mock-interview' ? '' : 'brightness-0'}`}
                    />
                    <span className='text-sm'>Mock Interview</span>
                  </Link>
                </div>
                <div className='relative'>
                  {pathname === '/onboard-job' && (
                    <div className='sidebar-indicator sidebar-indicator-onboard'></div>
                  )}
                  <Link
                    href='/onboard-job'
                    className={`flex items-center gap-3 py-3 px-4 rounded-md font-medium transition-all duration-200 ${
                      pathname === '/onboard-job'
                        ? 'point-ask-gradient text-white shadow-sm'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <Image
                      src='/images/onboardJob.svg'
                      alt='Onboard Job (AI)'
                      width={20}
                      height={20}
                      className={`h-5 w-5 flex-shrink-0 ${pathname === '/onboard-job' ? '' : 'brightness-0'}`}
                    />
                    <span className='text-sm'>Onboard Job (AI)</span>
                  </Link>
                </div>
              </nav>
            </div>
          </SidebarContent>
        </>
      )}

      {/* Sidebar for desktop (always visible) */}
      <Sidebar>
        <SidebarContent
          className={`bg-white h-screen fixed left-0 top-0 transition-all duration-300 flex flex-col justify-between overflow-hidden ${
            collapsed ? 'w-16' : 'w-64'
          } ${
            nunitoSans.className
          } hidden lg:flex overflow-y-auto scrollbar-hide`}
        >
          <div>
            <div
              className={`transition-all duration-300 ${
                collapsed ? 'overflow-hidden' : ''
              }`}
            >
              <SidebarHeader items={data.navMain2} />
            </div>
            {/* Desktop collapse button */}
            <button
              onClick={() => setCollapsed((prev) => !prev)}
              className={`absolute top-7 z-20 bg-white rounded-full shadow hover:bg-gray-100 transition-all duration-200 ${
                collapsed ? 'right-2' : 'right-4'
              }`}
              aria-label='Toggle sidebar'
            >
              <svg
                width='24'
                height='24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
              >
                <path d={collapsed ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
              </svg>
            </button>
            <nav
              className={`flex flex-col flex-1 space-y-2 mt-4 overflow-y-auto scrollbar-hide pb-4 transition-all duration-300 ${
                collapsed ? 'px-2' : 'px-4'
              }`}
            >
              {/* Section Heading */}
              {!collapsed && (
                <div className='pt-2 pb-3'>
                  <span className='text-xs text-gray-400 font-medium uppercase tracking-wider'>
                    For students
                  </span>
                  <div className='border-b border-gray-700 mt-3' />
                </div>
              )}

              {/* Dashboard */}
              <div className='relative'>
                {' '}
                {pathname === '/' && (
                  <div className='sidebar-indicator sidebar-indicator-dashboard'></div>
                )}{' '}
                <Link
                  href='/'
                  className={`flex items-center ${
                    collapsed ? 'justify-center px-2' : 'gap-3 px-4'
                  } py-3 rounded-md font-medium transition-all duration-200 relative ${
                    pathname === '/'
                      ? 'bg-gradient-to-r from-[#FFB31F] to-[#FF4949] text-white shadow-sm'
                      : 'text-[#222] hover:bg-[#FFB12133]'
                  }`}
                >
                  {' '}
                  <DashboardIcon color={pathname === '/' ? '#fff' : '#222'} />{' '}
                  {!collapsed && <span className='text-sm'>Dashboard</span>}{' '}
                </Link>{' '}
              </div>
              {/* AI Tutor Dropdown */}
              <div className='mb-2'>
                <div className='relative'>
                  {isAiTutorActive && (
                    <div className='sidebar-indicator sidebar-indicator-ai-tutor'></div>
                  )}
                  <button
                    onClick={() => !collapsed && setAiOpen(!aiOpen)}
                    className={`w-full flex items-center ${
                      collapsed ? 'justify-center px-2' : 'justify-between px-4'
                    } py-3 rounded-md font-medium transition-all duration-200 ${
                      isAiTutorActive
                        ? 'bg-gradient-to-r from-[#FFB31F] to-[#FF4949] text-white shadow-sm'
                        : 'text-black hover:bg-white/10'
                    } ${collapsed ? 'cursor-default' : 'cursor-pointer'}`}
                    disabled={collapsed}
                  >
                    <span
                      className={`flex items-center ${
                        collapsed ? '' : 'gap-3'
                      }`}
                    >
                      <MicIcon style={{ color: isAiTutorActive ? '#fff' : '#222' }} />
                      {!collapsed && <span className='text-sm'>AI Tutor</span>}
                    </span>
                    {!collapsed && (
                      <ChevronUpDownIcon open={aiOpen || isAiTutorActive} />
                    )}
                  </button>
                </div>
                {!collapsed && (aiOpen || isAiTutorActive) && (
                  <div className='ml-6 mt-3 flex flex-col gap-2'>
                    {aiTutorSubRoutes.map((sub) => {
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={`flex items-center gap-3 px-4 py-3 mb-1 rounded-md text-sm font-medium transition-all duration-200 ${
                            isSubActive
                              ? 'bg-[#FFB12133] text-[#FF4949]'
                              : 'text-[#222] hover:bg-[#FFB12133]'
                          }`}
                        >
                          <div className='flex-shrink-0'>{sub.icon}</div>
                          <span>{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
              {/* Point & Ask Dropdown */}
              <div className='mb-2'>
                <div className='relative'>
                  {isPointAskActive && (
                    <div className='sidebar-indicator sidebar-indicator-point-ask'></div>
                  )}
                  <button
                    onClick={() => !collapsed && setPointOpen(!pointOpen)}
                    className={`w-full flex items-center ${
                      collapsed ? 'justify-center px-2' : 'justify-between px-4'
                    } py-3 rounded-md font-medium transition-all duration-200 ${
                      isPointAskActive
                        ? 'bg-gradient-to-r from-[#FFB31F] to-[#FF4949] text-white shadow-sm'
                        : 'text-black hover:bg-white/10'
                    } ${collapsed ? 'cursor-default' : 'cursor-pointer'}`}
                    disabled={collapsed}
                  >
                    <span
                      className={`flex items-center ${
                        collapsed ? '' : 'gap-3'
                      }`}
                    >
                      <Pointer style={{ color: isPointAskActive ? '#fff' : '#222' }} />
                      {!collapsed && (
                        <span className='text-sm'>Point & Ask</span>
                      )}
                    </span>
                    {!collapsed && (
                      <ChevronUpDownIcon open={pointOpen || isPointAskActive} />
                    )}
                  </button>
                </div>
                {!collapsed && (pointOpen || isPointAskActive) && (
                  <div className='ml-6 mt-3 flex flex-col gap-2'>
                    {pointAskSubRoutes.map((sub) => {
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={`flex items-center gap-3 px-4 mb-1 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                            isSubActive
                              ? 'bg-[#FFB12133] text-[#FF4949]'
                              : 'text-[#222] hover:bg-[#FFB12133]'
                          }`}
                        >
                          <div className='flex-shrink-0'>{sub.icon}</div>
                          <span>{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
              {/* Quiz Dropdown */}
              <div className='mb-2'>
                <div className='relative'>
                  {isQuizActive && (
                    <div className='sidebar-indicator sidebar-indicator-quiz'></div>
                  )}
                  <button
                    onClick={() => !collapsed && setQuizOpen(!quizOpen)}
                    className={`w-full flex items-center ${
                      collapsed ? 'justify-center px-2' : 'justify-between px-4'
                    } py-3 rounded-md font-medium transition-all duration-200 ${
                      isQuizActive
                        ? 'bg-gradient-to-r from-[#FFB31F] to-[#FF4949] text-white shadow-sm'
                        : 'text-black hover:bg-white/10'
                    } ${collapsed ? 'cursor-default' : 'cursor-pointer'}`}
                    disabled={collapsed}
                  >
                    <span
                      className={`flex items-center ${
                        collapsed ? '' : 'gap-3'
                      }`}
                    >
                      <Image
                        src={quizWhite}
                        alt='Quiz'
                        width={20}
                        height={20}
                        className={`h-5 w-5 flex-shrink-0 ${isQuizActive ? '' : 'brightness-0'}`}
                      />
                      {!collapsed && <span className='text-sm'>Quizzes</span>}
                    </span>
                    {!collapsed && (
                      <ChevronUpDownIcon open={quizOpen || isQuizActive} />
                    )}
                  </button>
                </div>
                {!collapsed && (quizOpen || isQuizActive) && (
                  <div className='ml-6 mt-3 flex flex-col gap-2'>
                    {quizSubRoutes.map((sub) => {
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={`flex items-center gap-3 px-4 mb-1 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                            isSubActive
                              ? 'bg-[#FFB12133] text-[#FF4949]'
                              : 'text-[#222] hover:bg-[#FFB12133]'
                          }`}
                        >
                          <Image
                            src={sub.icon}
                            alt={sub.label}
                            width={20}
                            height={20}
                            className={`h-5 w-5 flex-shrink-0 ${isSubActive ? '' : 'brightness-0'}`}
                          />
                          <span>{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
              {/* Exam Dropdown */}
              <div className='mb-2'>
                <div className='relative'>
                  {isExamActive && (
                    <div className='sidebar-indicator sidebar-indicator-quiz'></div>
                  )}
                  <button
                    onClick={() => !collapsed && setExamOpen(!examOpen)}
                    className={`w-full flex items-center ${
                      collapsed ? 'justify-center px-2' : 'justify-between px-4'
                    } py-3 rounded-md font-medium transition-all duration-200 ${
                      isExamActive
                        ? 'bg-gradient-to-r from-[#FFB31F] to-[#FF4949] text-white shadow-sm'
                        : 'text-black hover:bg-white/10'
                    } ${collapsed ? 'cursor-default' : 'cursor-pointer'}`}
                    disabled={collapsed}
                  >
                    <span
                      className={`flex items-center ${
                        collapsed ? '' : 'gap-3'
                      }`}
                    >
                      <Image
                        src={examsWhite}
                        alt='Exams'
                        width={20}
                        height={20}
                        className={`h-5 w-5 flex-shrink-0 ${isExamActive ? '' : 'brightness-0'}`}
                      />
                      {!collapsed && <span className='text-sm'>Exams</span>}
                    </span>
                    {!collapsed && (
                      <ChevronUpDownIcon open={examOpen || isExamActive} />
                    )}
                  </button>
                </div>
                {!collapsed && (examOpen || isExamActive) && (
                  <div className='ml-6 mt-3 flex flex-col gap-2'>
                    {examSubRoutes.map((sub) => {
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={`flex items-center gap-3 px-4 py-3 mb-1 rounded-md text-sm font-medium transition-all duration-200 ${
                            isSubActive
                              ? 'bg-[#FFB12133] text-[#FF4949]'
                              : 'text-[#222] hover:bg-[#FFB12133]'
                          }`}
                        >
                          <Image
                            src={sub.icon}
                            alt={sub.label}
                            width={20}
                            height={20}
                            className={`h-5 w-5 flex-shrink-0 ${isSubActive ? '' : 'brightness-0'}`}
                          />
                          <span>{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
              {/* Projects Dropdown */}
              <div className='mb-2'>
                <div className='relative'>
                  {isProjectsActive && (
                    <div className='sidebar-indicator sidebar-indicator-projects'></div>
                  )}
                  <button
                    onClick={() => !collapsed && setProjectOpen(!projectsOpen)}
                    className={`w-full flex items-center ${
                      collapsed ? 'justify-center px-2' : 'justify-between px-4'
                    } py-3 rounded-md font-medium transition-all duration-200 ${
                      isProjectsActive
                        ? 'bg-gradient-to-r from-[#FFB31F] to-[#FF4949] text-white shadow-sm'
                        : 'text-black hover:bg-white/10'
                    } ${collapsed ? 'cursor-default' : 'cursor-pointer'}`}
                    disabled={collapsed}
                  >
                    <span
                      className={`flex items-center ${
                        collapsed ? '' : 'gap-3'
                      }`}
                    >
                      <Image
                        src={projectsWhite}
                        alt='projects'
                        width={20}
                        height={20}
                        className={`h-5 w-5 flex-shrink-0 ${isProjectsActive ? '' : 'brightness-0'}`}
                      />
                      {!collapsed && <span className='text-sm'>Projects</span>}
                    </span>
                    {!collapsed && (
                      <ChevronUpDownIcon open={projectsOpen || isProjectsActive} />
                    )}
                  </button>
                </div>
                {!collapsed && (projectsOpen || isProjectsActive) && (
                  <div className='ml-6 mt-3 flex flex-col gap-2'>
                    {projectSubRoutes.map((sub) => {
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={`flex items-center gap-3 px-4 py-3 mb-1 rounded-md text-sm font-medium transition-all duration-200 ${
                            isSubActive
                              ? 'bg-[#FFB12133] text-[#FF4949]'
                              : 'text-[#222] hover:bg-[#FFB12133]'
                          }`}
                        >
                          <Image
                            src={sub.icon}
                            alt={sub.label}
                            width={20}
                            height={20}
                            className={`h-5 w-5 flex-shrink-0 ${isSubActive ? '' : 'brightness-0'}`}
                          />
                          <span>{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
              {/* Other menu items */}
              {data.items
                .filter(
                  (item) =>
                    item.title !== 'Take a Quiz' &&
                    item.title !== 'Generate Quiz'
                )
                .slice(2)
                .map((item, index) => {
                  const isActive = pathname === item.url;
                  const indicatorClasses = [
                    'sidebar-indicator-quiz',
                    'sidebar-indicator-projects',
                    'sidebar-indicator-progress',
                    'sidebar-indicator-exams',
                  ];
                  return (
                    <div key={item.title} className='relative'>
                      {isActive && (
                        <div
                          className={`sidebar-indicator ${indicatorClasses[index]}`}
                        ></div>
                      )}
                      <Link
                        href={item.url}
                        className={`flex items-center ${
                          collapsed ? 'justify-center px-2' : 'gap-3 px-4'
                        } py-3 rounded-md font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-[#FFB31F] to-[#FF4949] text-white shadow-sm'
                            : 'text-[#222] hover:bg-[#FFB12133]'
                        }`}
                      >
                        <Image
                          src={item.icon}
                          alt={item.title}
                          className={`h-5 w-5 flex-shrink-0 ${isActive ? '' : 'brightness-0'}`}
                        />
                        {!collapsed && (
                          <span className='text-sm'>{item.title}</span>
                        )}
                      </Link>
                    </div>
                  );
                })}
              {/* Section Heading for Corporates */}
              {!collapsed && (
                <div className='pt-6 pb-3'>
                  <span className='text-xs text-gray-400 font-medium uppercase tracking-wider'>
                    For Corporates
                  </span>
                  <div className='border-b border-gray-700 mt-3' />
                </div>
              )}

              {/* Corporate links */}
              <div className='relative'>
                {pathname === '/mock-interview' && (
                  <div className='sidebar-indicator sidebar-indicator-mock'></div>
                )}
                <Link
                  href='/mock-interview'
                  className={`flex items-center ${
                    collapsed ? 'justify-center px-2' : 'gap-3 px-4'
                  } py-3 rounded-md font-medium transition-all duration-200 ${
                    pathname === '/mock-interview'
                      ? 'bg-gradient-to-r from-[#FFB31F] to-[#FF4949] text-white shadow-sm'
                      : 'text-black hover:bg-white/10'
                  }`}
                >
                  <Image
                    src='/images/speechmock.svg'
                    alt='Mock Interview'
                    width={20}
                    height={20}
                    className={`h-5 w-5 flex-shrink-0 ${pathname === '/mock-interview' ? '' : 'brightness-0'}`}
                  />
                  {!collapsed && (
                    <span className='text-sm'>Mock Interview</span>
                  )}
                </Link>
              </div>

              <div className='relative'>
                {pathname === '/onboard-job' && (
                  <div className='sidebar-indicator sidebar-indicator-onboard'></div>
                )}
                <Link
                  href='/onboard-job'
                  className={`flex items-center ${
                    collapsed ? 'justify-center px-2' : 'gap-3 px-4'
                  } py-3 rounded-md font-medium transition-all duration-200 ${
                    pathname === '/onboard-job'
                      ? 'bg-gradient-to-r from-[#FFB31F] to-[#FF4949] text-white shadow-sm'
                      : 'text-black hover:bg-white/10'
                  }`}
                >
                  <Image
                    src='/images/onboardJob.svg'
                    alt='Onboard Job (AI)'
                    width={20}
                    height={20}
                    className={`h-5 w-5 flex-shrink-0 ${pathname === '/onboard-job' ? '' : 'brightness-0'}`}
                  />
                  {!collapsed && (
                    <span className='text-sm'>Onboard Job (AI)</span>
                  )}
                </Link>
              </div>
            </nav>
          </div>
        </SidebarContent>
      </Sidebar>
    </div>
  );
}