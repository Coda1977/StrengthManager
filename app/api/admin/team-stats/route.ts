import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/auth/admin-middleware';
import { strengthsData } from '@/lib/utils/strengthsData';

export async function GET() {
  try {
    // Verify admin access
    const adminCheck = await verifyAdmin();
    if (!adminCheck.authorized) {
      return adminCheck.response;
    }

    const supabase = await createClient();

    // Get all team members
    const { data: teamMembers, error: teamError } = await supabase
      .from('team_members')
      .select('id, user_id, top_5_strengths');

    if (teamError) {
      console.error('Error fetching team members:', teamError);
      return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
    }

    // Type the team members data
    interface TeamMember {
      id: string;
      user_id: string;
      top_5_strengths: string[];
    }
    const typedTeamMembers = (teamMembers || []) as TeamMember[];

    // Calculate total teams (count of all team members)
    const totalTeams = typedTeamMembers.length;

    // Calculate total unique users with teams
    const uniqueUserIds = new Set(typedTeamMembers.map((tm) => tm.user_id));
    const totalUsers = uniqueUserIds.size;

    // Calculate average team size (team members per user)
    const averageTeamSize = totalUsers > 0 ? (totalTeams / totalUsers).toFixed(1) : '0';

    // Aggregate all strengths with their domains
    const strengthCounts: Record<string, { count: number; domain: string }> = {};
    
    typedTeamMembers.forEach((member) => {
      member.top_5_strengths.forEach((strength: string) => {
        if (!strengthCounts[strength]) {
          const domain = strengthsData[strength]?.domain || 'Unknown';
          strengthCounts[strength] = { count: 0, domain };
        }
        strengthCounts[strength].count++;
      });
    });

    // Get top 10 strengths
    const topStrengths = Object.entries(strengthCounts)
      .map(([name, data]) => ({
        name,
        count: data.count,
        domain: data.domain,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate domain distribution
    const domainCounts: Record<string, number> = {
      'Executing': 0,
      'Influencing': 0,
      'Relationship Building': 0,
      'Strategic Thinking': 0,
    };

    Object.values(strengthCounts).forEach((data) => {
      if (domainCounts[data.domain] !== undefined) {
        domainCounts[data.domain] += data.count;
      }
    });

    const totalStrengthsCount = Object.values(domainCounts).reduce((sum, count) => sum + count, 0);
    
    const domainDistribution = Object.entries(domainCounts).map(([domain, count]) => ({
      domain,
      count,
      percentage: totalStrengthsCount > 0 ? parseFloat(((count / totalStrengthsCount) * 100).toFixed(1)) : 0,
    }));

    // Calculate team size distribution
    const userTeamSizes: Record<string, number> = {};
    typedTeamMembers.forEach((member) => {
      const userId = member.user_id;
      userTeamSizes[userId] = (userTeamSizes[userId] || 0) + 1;
    });

    const teamSizeRanges = {
      '1-2': 0,
      '3-5': 0,
      '6-10': 0,
      '11+': 0,
    };

    Object.values(userTeamSizes).forEach((size) => {
      if (size <= 2) teamSizeRanges['1-2']++;
      else if (size <= 5) teamSizeRanges['3-5']++;
      else if (size <= 10) teamSizeRanges['6-10']++;
      else teamSizeRanges['11+']++;
    });

    const teamSizeDistribution = Object.entries(teamSizeRanges).map(([range, count]) => ({
      range,
      count,
    }));

    return NextResponse.json({
      totalTeams,
      totalUsers,
      averageTeamSize,
      topStrengths,
      domainDistribution,
      teamSizeDistribution,
    });
  } catch (error) {
    console.error('Error in team-stats API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}