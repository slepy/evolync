import { SchoolDashboard } from '@/modules/dashboard';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

/**
 * School-specific dashboard screen.
 * Displays overview, stats, and quick actions for a specific school.
 */
export default function SchoolDashboardScreen() {
  const { schoolId } = useLocalSearchParams<{ schoolId: string }>();

  return <SchoolDashboard schoolId={schoolId} />;
}
