import React, { useEffect, useState } from 'react';
import { CampusService } from '@/services/campusService';
import { CampusClub } from '@solvesphere/shared';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Users,
  Search,
  Calendar,
  Sparkles,
  UserCheck,
  CheckCircle,
  Tag,
} from 'lucide-react';

export const CampusClubsPage: React.FC = () => {
  const [clubs, setClubs] = useState<CampusClub[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [joinedClubIds, setJoinedClubIds] = useState<string[]>(['club-ai']);

  useEffect(() => {
    CampusService.getClubs().then(setClubs);
  }, []);

  const filteredClubs = clubs.filter((c) => {
    if (selectedCategory !== 'ALL' && c.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const toggleJoinClub = (id: string) => {
    setJoinedClubIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="cyan" size="sm">Student Life</Badge>
          <span className="text-xs text-slate-500 font-semibold">Campus Communities &amp; Societies</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
          Campus Club Directory
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Discover student-led engineering chapters, AI clubs, robotics teams, design circles, and debate unions.
        </p>
      </div>

      {/* Search & Category Filter */}
      <Card className="p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <Input
              placeholder="Search clubs by name, technology, or activity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              <option value="ALL">All Club Categories</option>
              <option value="TECHNOLOGY">Technology &amp; Robotics</option>
              <option value="CULTURE">Design &amp; Creative</option>
              <option value="LITERARY">Literary &amp; Debate</option>
              <option value="SPORTS">Sports &amp; Fitness</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Club Grid */}
      {filteredClubs.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8" />}
          title="No clubs found"
          description="Try adjusting your keyword search or category filter."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
              }}
            >
              Reset Filters
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredClubs.map((club) => {
            const isJoined = joinedClubIds.includes(club.id);

            return (
              <Card key={club.id} hoverEffect className="p-6 flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <Badge variant="cyan" size="sm">
                      {club.category}
                    </Badge>
                    <span className="text-xs text-slate-400 font-semibold">
                      {club.memberCount + (isJoined ? 1 : 0)} Members
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {club.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {club.description}
                  </p>

                  <div className="space-y-1.5 pt-2 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-brand-blue" />
                      <span>Club Lead: <strong>{club.leadName}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      <span>Meeting: <strong>{club.meetingSchedule}</strong></span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {club.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Recent Activities */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs">
                    <span className="font-bold text-[11px] text-slate-400 uppercase tracking-wider">
                      Recent Activities:
                    </span>
                    <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 text-[11px] space-y-0.5">
                      {club.recentActivities.map((act) => (
                        <li key={act}>{act}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    variant={isJoined ? 'outline' : 'gradient'}
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => toggleJoinClub(club.id)}
                  >
                    {isJoined ? (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Member &bull; Leave Club (Demo)
                      </span>
                    ) : (
                      <span>Join Society Roster &rarr;</span>
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
