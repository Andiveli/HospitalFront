import { inject, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';
import { CitaResponseDto } from '../models/citas.models';

/**
 * Utility functions for appointment time calculations
 */

// Helper: Check if current time is within 5 minutes of appointment time
export function isAppointmentTimeReady(appointmentDateTime: string): boolean {
  const now = new Date();
  const appointmentTime = new Date(appointmentDateTime);
  
  // Calculate appointment time minus 5 minutes
  const fiveMinutesBefore = new Date(appointmentTime.getTime() - 5 * 60 * 1000);
  
  // Ready if current time is 5 minutes before or after appointment time
  return now >= fiveMinutesBefore && now < appointmentTime;
}

// Helper: Check if appointment has passed (including a grace period)
export function hasAppointmentExpired(appointmentDateTime: string, appointmentEndTime: string): boolean {
  const now = new Date();
  const endTime = new Date(appointmentEndTime);
  
  // Add 15 minutes grace period after end time
  const gracePeriodEnd = new Date(endTime.getTime() + 15 * 60 * 1000);
  
  return now >= gracePeriodEnd;
}

// Helper: Format appointment time for display
export function formatAppointmentTime(dateTimeString: string): string {
  const date = new Date(dateTimeString);
  return date.toLocaleTimeString('es-EC', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

// Helper: Format appointment date for display
export function formatAppointmentDate(dateTimeString: string): string {
  const date = new Date(dateTimeString);
  return date.toLocaleDateString('es-EC', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Helper: Get remaining time until appointment is ready
export function getTimeUntilReady(appointmentDateTime: string): string {
  const now = new Date();
  const appointmentTime = new Date(appointmentDateTime);
  const readyTime = new Date(appointmentTime.getTime() - 5 * 60 * 1000);
  
  const diffMs = readyTime.getTime() - now.getTime();
  
  if (diffMs <= 0) return 'Disponible';
  
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) return `En ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  if (diffHours > 0) return `En ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  if (diffMins > 0) return `En ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
  
  return 'En menos de 1 minuto';
}