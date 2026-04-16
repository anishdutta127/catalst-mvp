'use client';

import { MILESTONES, getMilestoneForScreen, type ScreenId } from '@/lib/constants';
import { motion } from 'framer-motion';

interface MilestoneBarProps {
  currentScreen: ScreenId;
  completedScreens: ScreenId[];
}

export function MilestoneBar({ currentScreen, completedScreens }: MilestoneBarProps) {
  const currentMilestone = getMilestoneForScreen(currentScreen);
  const currentIdx = MILESTONES.findIndex((m) => m.id === currentMilestone?.id);

  // On mobile: show current + next 2 + IDEAS (if not visible)
  // On desktop: show all
  return (
    <div className="flex items-center gap-1">
      {MILESTONES.map((milestone, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isIdeas = milestone.id === 'ideas';
        const isFuture = idx > currentIdx;

        return (
          <div key={milestone.id} className="flex items-center">
            {/* Connector line */}
            {idx > 0 && (
              <div
                className={`w-3 h-px mx-0.5 transition-colors duration-500 ${
                  isCompleted ? 'bg-gold/60' : 'bg-ivory/10'
                }`}
              />
            )}

            {/* Milestone dot */}
            <motion.div
              className={`relative flex items-center justify-center text-xs transition-all duration-500
                ${isCurrent ? 'scale-110' : ''}
                ${isIdeas && !isCompleted ? 'scale-115' : ''}
              `}
              animate={isCurrent ? { scale: [1, 1.15, 1] } : {}}
              transition={isCurrent ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
            >
              <span
                className={`
                  ${isCompleted ? 'opacity-100' : isCurrent ? 'opacity-100' : 'opacity-30'}
                  ${isCurrent ? 'drop-shadow-[0_0_6px_rgba(212,168,67,0.5)]' : ''}
                  ${isIdeas && !isCompleted && !isCurrent ? 'opacity-50 drop-shadow-[0_0_4px_rgba(212,168,67,0.2)]' : ''}
                `}
              >
                {milestone.icon}
              </span>

              {/* Mobile: hide future milestones beyond current+2, except IDEAS */}
              {isFuture && !isIdeas && idx > currentIdx + 2 && (
                <style>{`
                  @media (max-width: 640px) {
                    [data-milestone="${milestone.id}"] { display: none; }
                  }
                `}</style>
              )}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
