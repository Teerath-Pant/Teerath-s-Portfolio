// Default portfolio data — admin reads this as initial state.
// When you hit "Save & Apply", these values get written to
// ../web/src/data/portfolioData.js and the portfolio hot-reloads.

export const defaultData = {
  profile: {
    name: 'Your Name',
    title: 'Full Stack Developer',
    location: 'Your City, Country',
    headline: 'Transforming Your Ideas into Reality',
    subtext:
      'Passionate about creating intuitive and engaging user experiences. Specializing in transforming ideas into beautifully crafted digital products.',
    availableForWork: true,
  },

  stats: [
    { value: '+3',  label: 'Years of\nExperience' },
    { value: '+12', label: 'Projects\nCompleted'  },
    { value: '+20', label: 'Skills\nMastered'     },
  ],

  socials: [
    { label: 'GitHub',    href: 'https://github.com',    platform: 'github' },
    { label: 'LinkedIn',  href: 'https://linkedin.com',  platform: 'linkedin' },
    { label: 'Twitter',   href: 'https://twitter.com',   platform: 'twitter' },
    { label: 'Email',     href: 'mailto:hello@portfolio.dev', platform: 'email' },
  ],

  bioPoints: [
    { icon: '🎓', label: 'Education', value: 'Computer Science' },
    { icon: '📍', label: 'Location',  value: 'India'            },
    { icon: '💼', label: 'Status',    value: 'Open to opportunities' },
    { icon: '🛠️', label: 'Focus',     value: 'Frontend Development' },
  ],

  audience: [
    'Recruiters and hiring managers',
    'Internship evaluators',
    'Developers reviewing work',
  ],

  goals: [
    'Create a clean, modern, mobile-first UI',
    'Ensure smooth navigation and animations',
    'Display projects in an engaging way',
    'Maintain responsiveness and performance',
  ],

  projectCards: [
    {
      title: 'E-Commerce Platform',
      description: 'Full-stack shopping app with cart, auth and payments built with React and Node.js.',
      tag: 'Full Stack',
      link: '#',
      showOnHome: true,
    },
    {
      title: 'Portfolio OS',
      description: 'This very portfolio — an Android OS-inspired interface with smooth animations.',
      tag: 'UI/UX',
      link: '#',
      showOnHome: true,
    },
    {
      title: 'Real-Time Chat',
      description: 'WebSocket-powered chat application with rooms, typing indicators and message history.',
      tag: 'Backend',
      link: '#',
      showOnHome: true,
    },
    {
      title: 'AI Dashboard',
      description: 'Analytics dashboard integrating OpenAI API for data summarisation and insights.',
      tag: 'AI',
      link: '#',
      showOnHome: false,
    },
  ],

  skillLevels: [
    { label: 'React (Vite)',   value: 92 },
    { label: 'Tailwind CSS',   value: 94 },
    { label: 'Framer Motion',  value: 88 },
    { label: 'React Router',   value: 85 },
    { label: 'Node.js / Express', value: 78 },
  ],

  technicalMastery: [
    {
      title: "Frontend",
      icon: "frontend",
      skills: ["REACT", "NEXT.JS", "TYPESCRIPT", "TAILWIND", "THREE.JS", "REDUX"]
    },
    {
      title: "Backend",
      icon: "backend",
      skills: ["NODE.JS", "PYTHON", "POSTGRES", "MONGODB", "REDIS", "PRISMA"]
    },
    {
      title: "DevOps/Tools",
      icon: "devops",
      skills: ["DOCKER", "AWS", "CI/CD", "GIT", "VERCEL", "FIGMA"]
    }
  ],

  futureEnhancements: [
    'Dark and light mode switching',
    'PWA support for installability',
    'Backend integration for contact handling',
    'Advanced animation flows and gestures',
  ],
}
