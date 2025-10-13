import {
  ALL_STRENGTHS,
  getStrengthDomain,
  calculateDomainBalance,
  calculateTeamAnalytics,
  findComplementaryStrengths,
  identifyTeamGaps,
  formatStrengthName,
  getDomainColor,
  validateStrengthSelection,
  sortStrengthsByDomain,
} from '@/lib/utils/strengths'
import type { TeamMember } from '@/types'

describe('strengths utility functions', () => {
  describe('getStrengthDomain', () => {
    it('should return correct domain for valid strength', () => {
      expect(getStrengthDomain('Achiever')).toBe('Executing')
      expect(getStrengthDomain('Activator')).toBe('Influencing')
      expect(getStrengthDomain('Adaptability')).toBe('Relationship Building')
      expect(getStrengthDomain('Analytical')).toBe('Strategic Thinking')
    })

    it('should return default domain for invalid strength', () => {
      expect(getStrengthDomain('InvalidStrength')).toBe('Strategic Thinking')
      expect(getStrengthDomain('')).toBe('Strategic Thinking')
    })
  })

  describe('calculateDomainBalance', () => {
    it('should calculate correct balance for mixed strengths', () => {
      const strengths = ['Achiever', 'Activator', 'Adaptability', 'Analytical', 'Arranger']
      const balance = calculateDomainBalance(strengths)
      
      expect(balance.executing).toBe(2) // Achiever, Arranger
      expect(balance.influencing).toBe(1) // Activator
      expect(balance.relationshipBuilding).toBe(1) // Adaptability
      expect(balance.strategicThinking).toBe(1) // Analytical
    })

    it('should handle empty array', () => {
      const balance = calculateDomainBalance([])
      
      expect(balance.executing).toBe(0)
      expect(balance.influencing).toBe(0)
      expect(balance.relationshipBuilding).toBe(0)
      expect(balance.strategicThinking).toBe(0)
    })

    it('should handle all strengths from same domain', () => {
      const strengths = ['Achiever', 'Arranger', 'Belief', 'Consistency', 'Deliberative']
      const balance = calculateDomainBalance(strengths)
      
      expect(balance.executing).toBe(5)
      expect(balance.influencing).toBe(0)
      expect(balance.relationshipBuilding).toBe(0)
      expect(balance.strategicThinking).toBe(0)
    })
  })

  describe('calculateTeamAnalytics', () => {
    const mockTeamMembers: TeamMember[] = [
      {
        id: '1',
        userId: 'user-1',
        name: 'Alice',
        top5Strengths: ['Achiever', 'Activator', 'Analytical', 'Arranger', 'Belief'],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        userId: 'user-2',
        name: 'Bob',
        top5Strengths: ['Communication', 'Empathy', 'Futuristic', 'Harmony', 'Ideation'],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ]

    it('should calculate correct total members', () => {
      const userStrengths = ['Achiever', 'Strategic', 'Learner', 'Input', 'Intellection']
      const analytics = calculateTeamAnalytics(mockTeamMembers, userStrengths)
      
      expect(analytics.totalMembers).toBe(3) // 2 team members + 1 user
    })

    it('should calculate domain balance correctly', () => {
      const userStrengths = ['Achiever', 'Strategic', 'Learner', 'Input', 'Intellection']
      const analytics = calculateTeamAnalytics(mockTeamMembers, userStrengths)
      
      expect(analytics.domainBalance.executing).toBeGreaterThan(0)
      expect(analytics.domainBalance.strategicThinking).toBeGreaterThan(0)
    })

    it('should identify top strengths', () => {
      const userStrengths = ['Achiever', 'Strategic', 'Learner', 'Input', 'Intellection']
      const analytics = calculateTeamAnalytics(mockTeamMembers, userStrengths)
      
      expect(analytics.topStrengths).toBeDefined()
      expect(analytics.topStrengths.length).toBeGreaterThan(0)
      expect(analytics.topStrengths[0]).toHaveProperty('name')
      expect(analytics.topStrengths[0]).toHaveProperty('count')
    })

    it('should create strength distribution', () => {
      const userStrengths = ['Achiever', 'Strategic', 'Learner', 'Input', 'Intellection']
      const analytics = calculateTeamAnalytics(mockTeamMembers, userStrengths)
      
      expect(analytics.strengthDistribution).toBeDefined()
      expect(Array.isArray(analytics.strengthDistribution)).toBe(true)
      
      const achieverDist = analytics.strengthDistribution.find(d => d.strength === 'Achiever')
      expect(achieverDist).toBeDefined()
      expect(achieverDist?.members).toContain('You')
      expect(achieverDist?.members).toContain('Alice')
    })

    it('should handle empty team', () => {
      const userStrengths = ['Achiever', 'Strategic', 'Learner', 'Input', 'Intellection']
      const analytics = calculateTeamAnalytics([], userStrengths)
      
      expect(analytics.totalMembers).toBe(1)
      expect(analytics.strengthDistribution.length).toBe(5)
    })
  })

  describe('findComplementaryStrengths', () => {
    it('should identify shared strengths', () => {
      const strengths1 = ['Achiever', 'Activator', 'Analytical']
      const strengths2 = ['Achiever', 'Empathy', 'Futuristic']
      
      const result = findComplementaryStrengths(strengths1, strengths2)
      
      expect(result.shared).toEqual(['Achiever'])
      expect(result.shared.length).toBe(1)
    })

    it('should identify unique strengths for each person', () => {
      const strengths1 = ['Achiever', 'Activator', 'Analytical']
      const strengths2 = ['Achiever', 'Empathy', 'Futuristic']
      
      const result = findComplementaryStrengths(strengths1, strengths2)
      
      expect(result.unique1).toEqual(['Activator', 'Analytical'])
      expect(result.unique2).toEqual(['Empathy', 'Futuristic'])
    })

    it('should detect domain complement for executing vs strategic thinking', () => {
      const strengths1 = ['Achiever', 'Arranger', 'Belief', 'Consistency', 'Deliberative']
      const strengths2 = ['Analytical', 'Futuristic', 'Ideation', 'Input', 'Strategic']
      
      const result = findComplementaryStrengths(strengths1, strengths2)
      
      expect(result.domainComplement).toBe(true)
    })

    it('should detect domain complement for influencing vs relationship building', () => {
      const strengths1 = ['Activator', 'Command', 'Communication', 'Maximizer', 'Woo']
      const strengths2 = ['Adaptability', 'Empathy', 'Harmony', 'Includer', 'Relator']
      
      const result = findComplementaryStrengths(strengths1, strengths2)
      
      expect(result.domainComplement).toBe(true)
    })

    it('should not detect complement for similar domains', () => {
      const strengths1 = ['Achiever', 'Arranger', 'Belief']
      const strengths2 = ['Consistency', 'Deliberative', 'Discipline']
      
      const result = findComplementaryStrengths(strengths1, strengths2)
      
      expect(result.domainComplement).toBe(false)
    })
  })

  describe('identifyTeamGaps', () => {
    it('should identify weak domains', () => {
      const teamMembers: TeamMember[] = [
        {
          id: '1',
          userId: 'user-1',
          name: 'Alice',
          top5Strengths: ['Achiever', 'Arranger', 'Belief', 'Consistency', 'Deliberative'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ]
      const userStrengths = ['Discipline', 'Focus', 'Responsibility', 'Restorative', 'Achiever']
      
      const gaps = identifyTeamGaps(teamMembers, userStrengths)
      
      expect(gaps.weakDomains).toContain('Influencing')
      expect(gaps.weakDomains).toContain('Relationship Building')
      expect(gaps.weakDomains).toContain('Strategic Thinking')
    })

    it('should identify missing strengths', () => {
      const teamMembers: TeamMember[] = []
      const userStrengths = ['Achiever', 'Activator', 'Adaptability', 'Analytical', 'Arranger']
      
      const gaps = identifyTeamGaps(teamMembers, userStrengths)
      
      expect(gaps.missingStrengths.length).toBeGreaterThan(0)
      expect(gaps.missingStrengths).not.toContain('Achiever')
      expect(gaps.missingStrengths).not.toContain('Activator')
    })

    it('should provide recommendations for weak domains', () => {
      const teamMembers: TeamMember[] = []
      const userStrengths = ['Achiever', 'Arranger', 'Belief', 'Consistency', 'Deliberative']
      
      const gaps = identifyTeamGaps(teamMembers, userStrengths)
      
      expect(gaps.recommendations.length).toBeGreaterThan(0)
      expect(gaps.recommendations.some(r => r.includes('Influencing'))).toBe(true)
    })
  })

  describe('formatStrengthName', () => {
    it('should return strength name unchanged', () => {
      expect(formatStrengthName('Achiever')).toBe('Achiever')
      expect(formatStrengthName('Self-Assurance')).toBe('Self-Assurance')
    })
  })

  describe('getDomainColor', () => {
    it('should return correct color for each domain', () => {
      expect(getDomainColor('Executing')).toBe('#8B5CF6')
      expect(getDomainColor('Influencing')).toBe('#F59E0B')
      expect(getDomainColor('Relationship Building')).toBe('#10B981')
      expect(getDomainColor('Strategic Thinking')).toBe('#3B82F6')
    })

    it('should return default color for invalid domain', () => {
      expect(getDomainColor('Invalid' as any)).toBe('#6B7280')
    })
  })

  describe('validateStrengthSelection', () => {
    it('should validate correct selection', () => {
      const strengths = ['Achiever', 'Activator', 'Adaptability', 'Analytical', 'Arranger']
      const result = validateStrengthSelection(strengths)
      
      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should reject selection with wrong count', () => {
      const strengths = ['Achiever', 'Activator', 'Adaptability']
      const result = validateStrengthSelection(strengths)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('You must select exactly 5 strengths')
    })

    it('should reject invalid strengths', () => {
      const strengths = ['Achiever', 'InvalidStrength', 'Adaptability', 'Analytical', 'Arranger']
      const result = validateStrengthSelection(strengths)
      
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('Invalid strengths'))).toBe(true)
    })

    it('should reject duplicate strengths', () => {
      const strengths = ['Achiever', 'Achiever', 'Adaptability', 'Analytical', 'Arranger']
      const result = validateStrengthSelection(strengths)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Strengths must be unique')
    })

    it('should report multiple errors', () => {
      const strengths = ['Achiever', 'Achiever', 'InvalidStrength']
      const result = validateStrengthSelection(strengths)
      
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
    })
  })

  describe('sortStrengthsByDomain', () => {
    it('should sort strengths by domain order', () => {
      const strengths = ['Strategic', 'Achiever', 'Empathy', 'Activator']
      const sorted = sortStrengthsByDomain(strengths)
      
      expect(sorted[0]).toBe('Achiever') // Executing
      expect(sorted[1]).toBe('Activator') // Influencing
      expect(sorted[2]).toBe('Empathy') // Relationship Building
      expect(sorted[3]).toBe('Strategic') // Strategic Thinking
    })

    it('should sort alphabetically within same domain', () => {
      const strengths = ['Belief', 'Achiever', 'Arranger']
      const sorted = sortStrengthsByDomain(strengths)
      
      expect(sorted).toEqual(['Achiever', 'Arranger', 'Belief'])
    })

    it('should handle empty array', () => {
      const sorted = sortStrengthsByDomain([])
      expect(sorted).toEqual([])
    })

    it('should handle single strength', () => {
      const sorted = sortStrengthsByDomain(['Achiever'])
      expect(sorted).toEqual(['Achiever'])
    })
  })

  describe('ALL_STRENGTHS constant', () => {
    it('should contain all 34 CliftonStrengths', () => {
      const strengthCount = Object.keys(ALL_STRENGTHS).length
      expect(strengthCount).toBe(34)
    })

    it('should have valid domains for all strengths', () => {
      const validDomains = ['Executing', 'Influencing', 'Relationship Building', 'Strategic Thinking']
      
      Object.values(ALL_STRENGTHS).forEach(domain => {
        expect(validDomains).toContain(domain)
      })
    })
  })
})