import type { 
  Strength, 
  TeamMember, 
  DomainBalance, 
  TeamAnalytics,
  StrengthDomain 
} from '@/types';

// All 34 CliftonStrengths with their domains
export const ALL_STRENGTHS: Record<string, StrengthDomain> = {
  'Achiever': 'Executing',
  'Activator': 'Influencing',
  'Adaptability': 'Relationship Building',
  'Analytical': 'Strategic Thinking',
  'Arranger': 'Executing',
  'Belief': 'Executing',
  'Command': 'Influencing',
  'Communication': 'Influencing',
  'Competition': 'Influencing',
  'Connectedness': 'Relationship Building',
  'Consistency': 'Executing',
  'Context': 'Strategic Thinking',
  'Deliberative': 'Executing',
  'Developer': 'Relationship Building',
  'Discipline': 'Executing',
  'Empathy': 'Relationship Building',
  'Focus': 'Executing',
  'Futuristic': 'Strategic Thinking',
  'Harmony': 'Relationship Building',
  'Ideation': 'Strategic Thinking',
  'Includer': 'Relationship Building',
  'Individualization': 'Relationship Building',
  'Input': 'Strategic Thinking',
  'Intellection': 'Strategic Thinking',
  'Learner': 'Strategic Thinking',
  'Maximizer': 'Influencing',
  'Positivity': 'Relationship Building',
  'Relator': 'Relationship Building',
  'Responsibility': 'Executing',
  'Restorative': 'Executing',
  'Self-Assurance': 'Influencing',
  'Significance': 'Influencing',
  'Strategic': 'Strategic Thinking',
  'Woo': 'Influencing',
};

// Get domain for a strength
export function getStrengthDomain(strengthName: string): StrengthDomain {
  return ALL_STRENGTHS[strengthName] || 'Strategic Thinking';
}

// Calculate domain balance for a set of strengths
export function calculateDomainBalance(strengths: string[]): DomainBalance {
  const balance: DomainBalance = {
    executing: 0,
    influencing: 0,
    relationshipBuilding: 0,
    strategicThinking: 0,
  };

  strengths.forEach(strength => {
    const domain = getStrengthDomain(strength);
    switch (domain) {
      case 'Executing':
        balance.executing++;
        break;
      case 'Influencing':
        balance.influencing++;
        break;
      case 'Relationship Building':
        balance.relationshipBuilding++;
        break;
      case 'Strategic Thinking':
        balance.strategicThinking++;
        break;
    }
  });

  return balance;
}

// Calculate team analytics
export function calculateTeamAnalytics(
  teamMembers: TeamMember[],
  userStrengths: string[]
): TeamAnalytics {
  // Combine all strengths (user + team)
  const allStrengths = [
    ...userStrengths,
    ...teamMembers.flatMap(m => m.top5Strengths),
  ];

  // Calculate domain balance
  const domainBalance = calculateDomainBalance(allStrengths);

  // Count strength occurrences
  const strengthCounts: Record<string, number> = {};
  allStrengths.forEach(strength => {
    strengthCounts[strength] = (strengthCounts[strength] || 0) + 1;
  });

  // Get top strengths
  const topStrengths = Object.entries(strengthCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  // Create strength distribution
  const strengthDistribution: { strength: string; members: string[] }[] = [];
  Object.keys(strengthCounts).forEach(strength => {
    const members: string[] = [];
    
    // Check if user has this strength
    if (userStrengths.includes(strength)) {
      members.push('You');
    }
    
    // Check team members
    teamMembers.forEach(member => {
      if (member.top5Strengths.includes(strength)) {
        members.push(member.name);
      }
    });

    if (members.length > 0) {
      strengthDistribution.push({ strength, members });
    }
  });

  return {
    totalMembers: teamMembers.length + 1, // +1 for user
    domainBalance,
    topStrengths,
    strengthDistribution: strengthDistribution.sort((a, b) => 
      b.members.length - a.members.length
    ),
  };
}

// Find complementary strengths between two people
export function findComplementaryStrengths(
  strengths1: string[],
  strengths2: string[]
): {
  shared: string[];
  unique1: string[];
  unique2: string[];
  domainComplement: boolean;
} {
  const shared = strengths1.filter(s => strengths2.includes(s));
  const unique1 = strengths1.filter(s => !strengths2.includes(s));
  const unique2 = strengths2.filter(s => !strengths1.includes(s));

  // Check if domains complement each other
  const domains1 = calculateDomainBalance(strengths1);
  const domains2 = calculateDomainBalance(strengths2);
  
  // Domains complement if they have different primary domains
  const domainComplement = 
    (domains1.executing > 2 && domains2.strategicThinking > 2) ||
    (domains1.strategicThinking > 2 && domains2.executing > 2) ||
    (domains1.influencing > 2 && domains2.relationshipBuilding > 2) ||
    (domains1.relationshipBuilding > 2 && domains2.influencing > 2);

  return {
    shared,
    unique1,
    unique2,
    domainComplement,
  };
}

// Identify potential team gaps
export function identifyTeamGaps(
  teamMembers: TeamMember[],
  userStrengths: string[]
): {
  weakDomains: StrengthDomain[];
  missingStrengths: string[];
  recommendations: string[];
} {
  const allStrengths = [
    ...userStrengths,
    ...teamMembers.flatMap(m => m.top5Strengths),
  ];

  const domainBalance = calculateDomainBalance(allStrengths);
  const totalStrengths = allStrengths.length;

  // Identify weak domains (less than 20% representation)
  const weakDomains: StrengthDomain[] = [];
  const threshold = totalStrengths * 0.2;

  if (domainBalance.executing < threshold) weakDomains.push('Executing');
  if (domainBalance.influencing < threshold) weakDomains.push('Influencing');
  if (domainBalance.relationshipBuilding < threshold) weakDomains.push('Relationship Building');
  if (domainBalance.strategicThinking < threshold) weakDomains.push('Strategic Thinking');

  // Find strengths not represented in team
  const representedStrengths = new Set(allStrengths);
  const missingStrengths = Object.keys(ALL_STRENGTHS).filter(
    s => !representedStrengths.has(s)
  );

  // Generate recommendations
  const recommendations: string[] = [];
  
  if (weakDomains.includes('Executing')) {
    recommendations.push('Consider adding team members with Executing strengths like Achiever, Discipline, or Focus for better task completion.');
  }
  if (weakDomains.includes('Influencing')) {
    recommendations.push('Your team could benefit from Influencing strengths like Communication, Woo, or Command for better stakeholder engagement.');
  }
  if (weakDomains.includes('Relationship Building')) {
    recommendations.push('Adding Relationship Building strengths like Empathy, Relator, or Developer could improve team cohesion.');
  }
  if (weakDomains.includes('Strategic Thinking')) {
    recommendations.push('Strategic Thinking strengths like Strategic, Analytical, or Futuristic would enhance planning and innovation.');
  }

  return {
    weakDomains,
    missingStrengths: missingStrengths.slice(0, 10), // Top 10 missing
    recommendations,
  };
}

// Format strength name for display
export function formatStrengthName(strength: string): string {
  return strength;
}

// Get domain color for UI
export function getDomainColor(domain: StrengthDomain): string {
  switch (domain) {
    case 'Executing':
      return '#8B5CF6'; // Purple
    case 'Influencing':
      return '#F59E0B'; // Amber
    case 'Relationship Building':
      return '#10B981'; // Green
    case 'Strategic Thinking':
      return '#3B82F6'; // Blue
    default:
      return '#6B7280'; // Gray
  }
}

// Validate strength selection
export function validateStrengthSelection(strengths: string[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (strengths.length !== 5) {
    errors.push('You must select exactly 5 strengths');
  }

  const invalidStrengths = strengths.filter(s => !ALL_STRENGTHS[s]);
  if (invalidStrengths.length > 0) {
    errors.push(`Invalid strengths: ${invalidStrengths.join(', ')}`);
  }

  const uniqueStrengths = new Set(strengths);
  if (uniqueStrengths.size !== strengths.length) {
    errors.push('Strengths must be unique');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Sort strengths by domain
export function sortStrengthsByDomain(strengths: string[]): string[] {
  return strengths.sort((a, b) => {
    const domainA = getStrengthDomain(a);
    const domainB = getStrengthDomain(b);
    
    if (domainA === domainB) {
      return a.localeCompare(b);
    }
    
    const domainOrder: StrengthDomain[] = [
      'Executing',
      'Influencing',
      'Relationship Building',
      'Strategic Thinking',
    ];
    
    return domainOrder.indexOf(domainA) - domainOrder.indexOf(domainB);
  });
}