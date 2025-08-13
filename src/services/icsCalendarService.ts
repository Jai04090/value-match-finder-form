import { FinancialTask, TaskCalendarEvent } from '@/types/spendingAnalysis';

export class ICSCalendarService {
  static generateICSData(tasks: FinancialTask[]): string {
    console.log('ICSCalendarService.generateICSData called with tasks:', tasks);
    
    if (!tasks || tasks.length === 0) {
      console.warn('No tasks provided to generateICSData');
      return '';
    }
    
    const calendarEvents = tasks.map(task => this.taskToCalendarEvent(task));
    console.log('Generated calendar events:', calendarEvents);
    
    return this.generateICSFile(calendarEvents);
  }

  static generateICSForTask(task: FinancialTask): string {
    const event = this.taskToCalendarEvent(task);
    return this.generateICSFile([event]);
  }

  private static taskToCalendarEvent(task: FinancialTask): TaskCalendarEvent {
    const startDate = task.dueDate ? new Date(task.dueDate) : this.getNextSuitableDate(task);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration

    return {
      id: crypto?.randomUUID?.() || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: task.userId,
      taskId: task.id,
      eventTitle: task.title,
      eventDescription: task.description || '',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      isRecurring: !!task.recurrencePattern,
      createdAt: new Date().toISOString()
    };
  }

  private static getNextSuitableDate(task: FinancialTask): Date {
    const now = new Date();
    
    switch (task.recurrencePattern) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
      case 'weekly':
        return this.getNextSunday(now); // Next Sunday for planning
      case 'twice-weekly':
        return this.getNextWednesday(now); // Mid-week
      case 'monthly':
        return this.getFirstOfNextMonth(now);
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
    }
  }

  private static getNextSunday(date: Date): Date {
    const result = new Date(date);
    result.setDate(date.getDate() + (7 - date.getDay()));
    result.setHours(9, 0, 0, 0); // 9 AM
    return result;
  }

  private static getNextWednesday(date: Date): Date {
    const result = new Date(date);
    const daysUntilWednesday = (3 - date.getDay() + 7) % 7 || 7;
    result.setDate(date.getDate() + daysUntilWednesday);
    result.setHours(18, 0, 0, 0); // 6 PM
    return result;
  }

  private static getFirstOfNextMonth(date: Date): Date {
    const result = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    result.setHours(10, 0, 0, 0); // 10 AM
    return result;
  }

  private static generateICSFile(events: TaskCalendarEvent[]): string {
    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Financial Wellness App//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    events.forEach(event => {
      icsLines.push(
        'BEGIN:VEVENT',
        `UID:${event.id}@financial-wellness-app.com`,
        `DTSTART:${this.formatDateForICS(new Date(event.startDate))}`,
        `DTEND:${this.formatDateForICS(new Date(event.endDate!))}`,
        `SUMMARY:${this.escapeICSText(event.eventTitle)}`,
        `DESCRIPTION:${this.escapeICSText(event.eventDescription || '')}`,
        `CREATED:${this.formatDateForICS(new Date(event.createdAt))}`,
        `LAST-MODIFIED:${this.formatDateForICS(new Date())}`,
        'STATUS:CONFIRMED',
        'TRANSP:OPAQUE'
      );

      if (event.isRecurring) {
        // Add recurrence rules based on task pattern
        icsLines.push('RRULE:FREQ=WEEKLY;BYDAY=SU'); // Default to weekly on Sunday
      }

      icsLines.push('END:VEVENT');
    });

    icsLines.push('END:VCALENDAR');
    return icsLines.join('\r\n');
  }

  private static formatDateForICS(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }

  private static escapeICSText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  }

  static downloadICSFile(icsData: string, filename: string = 'financial-tasks.ics'): void {
    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}