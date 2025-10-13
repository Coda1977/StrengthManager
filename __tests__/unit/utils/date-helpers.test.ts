import {
  getNextMonday,
  getTodayAtMidnight,
  formatEmailDate,
} from '@/lib/utils/date-helpers'

describe('date-helpers utility functions', () => {
  describe('getNextMonday', () => {
    it('should return next Monday when called on a Sunday', () => {
      // Mock a Sunday
      const sunday = new Date('2024-10-13T10:00:00Z') // Sunday
      jest.useFakeTimers()
      jest.setSystemTime(sunday)

      const nextMonday = getNextMonday()
      
      expect(nextMonday.getDay()).toBe(1) // Monday is day 1
      expect(nextMonday.getHours()).toBe(0)
      expect(nextMonday.getMinutes()).toBe(0)
      expect(nextMonday.getSeconds()).toBe(0)
      expect(nextMonday.getMilliseconds()).toBe(0)

      jest.useRealTimers()
    })

    it('should return next Monday when called on a Monday', () => {
      // Mock a Monday
      const monday = new Date('2024-10-14T10:00:00Z') // Monday
      jest.useFakeTimers()
      jest.setSystemTime(monday)

      const nextMonday = getNextMonday()
      
      expect(nextMonday.getDay()).toBe(1) // Monday is day 1
      expect(nextMonday.getDate()).toBe(monday.getDate() + 7) // Next week

      jest.useRealTimers()
    })

    it('should return next Monday when called on a Wednesday', () => {
      // Mock a Wednesday
      const wednesday = new Date('2024-10-16T10:00:00Z') // Wednesday
      jest.useFakeTimers()
      jest.setSystemTime(wednesday)

      const nextMonday = getNextMonday()
      
      expect(nextMonday.getDay()).toBe(1) // Monday is day 1
      expect(nextMonday.getDate()).toBe(21) // Next Monday is Oct 21

      jest.useRealTimers()
    })

    it('should set time to midnight', () => {
      const nextMonday = getNextMonday()
      
      expect(nextMonday.getHours()).toBe(0)
      expect(nextMonday.getMinutes()).toBe(0)
      expect(nextMonday.getSeconds()).toBe(0)
      expect(nextMonday.getMilliseconds()).toBe(0)
    })
  })

  describe('getTodayAtMidnight', () => {
    it('should return today with time set to midnight', () => {
      const now = new Date('2024-10-13T15:30:45.123Z')
      jest.useFakeTimers()
      jest.setSystemTime(now)

      const today = getTodayAtMidnight()
      
      expect(today.getFullYear()).toBe(2024)
      expect(today.getMonth()).toBe(9) // October is month 9 (0-indexed)
      expect(today.getDate()).toBe(13)
      expect(today.getHours()).toBe(0)
      expect(today.getMinutes()).toBe(0)
      expect(today.getSeconds()).toBe(0)
      expect(today.getMilliseconds()).toBe(0)

      jest.useRealTimers()
    })

    it('should be useful for date comparisons', () => {
      const today = getTodayAtMidnight()
      const anotherToday = getTodayAtMidnight()
      
      expect(today.getTime()).toBe(anotherToday.getTime())
    })
  })

  describe('formatEmailDate', () => {
    it('should format date correctly for US locale', () => {
      const date = new Date('2024-10-13T00:00:00Z')
      const formatted = formatEmailDate(date)
      
      expect(formatted).toContain('October')
      expect(formatted).toContain('13')
    })

    it('should include weekday in formatted string', () => {
      const monday = new Date('2024-10-14T00:00:00Z') // Monday
      const formatted = formatEmailDate(monday)
      
      expect(formatted).toContain('Monday')
    })

    it('should format different dates correctly', () => {
      const date1 = new Date('2024-01-01T00:00:00Z')
      const formatted1 = formatEmailDate(date1)
      
      expect(formatted1).toContain('January')
      expect(formatted1).toContain('1')
      
      const date2 = new Date('2024-12-25T00:00:00Z')
      const formatted2 = formatEmailDate(date2)
      
      expect(formatted2).toContain('December')
      expect(formatted2).toContain('25')
    })
  })
})