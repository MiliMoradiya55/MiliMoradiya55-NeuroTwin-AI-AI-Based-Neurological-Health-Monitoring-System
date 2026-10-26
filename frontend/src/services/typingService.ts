// frontend/src/services/typingService.ts

import api from './api';

// ============ TYPES ============
export interface Keystroke {
  hold_time: number;
  latency: number;
  flight_time?: number;
  hand?: string;
  direction?: string;
}

export interface TypingResult {
  score: number;
  risk_score: number;
  status: string;
  metrics: {
    typing_speed: number;
    key_latency: number;
    rhythm_variance: number;
    consistency: number;
    error_rate: number;
  };
  assessment_id?: number;
}

// ✅ NEW: Extended payload type with all 16 computed features
export interface TypingAssessPayload {
  // Keystroke data
  keystrokes: Keystroke[];
  sample_text?: string;
  text_typed?: string;

  // ✅ NEW: 16 optional pre-computed features
  hold_time_mean?: number;
  hold_time_std?: number;
  hold_time_min?: number;
  hold_time_max?: number;

  latency_mean?: number;
  latency_std?: number;
  latency_min?: number;
  latency_max?: number;

  flight_time_mean?: number;
  flight_time_std?: number;
  flight_time_min?: number;
  flight_time_max?: number;

  key_press_variance?: number;
  rhythm_variance?: number;
  backspace_frequency?: number;
  consistency_score?: number;
}

// ============ SERVICE ============
export const typingService = {
  /**
   * Send typing assessment with full feature set.
   */
  assess: async (data: TypingAssessPayload) => {
    try {
      // Build payload — include all available fields
      const payload: Record<string, any> = {
        keystrokes: data.keystrokes.map((k) => ({
          hold_time: k.hold_time || 0,
          latency: k.latency || 0,
          flight_time: k.flight_time || 0,
          hand: k.hand || 'R',
          direction: k.direction || 'S',
        })),
        sample_text: data.sample_text || '',
        text_typed: data.text_typed || '',
      };

      // ✅ NEW: Conditionally add the 16 new features if provided
      const optionalFeatures: (keyof TypingAssessPayload)[] = [
        'hold_time_mean', 'hold_time_std', 'hold_time_min', 'hold_time_max',
        'latency_mean', 'latency_std', 'latency_min', 'latency_max',
        'flight_time_mean', 'flight_time_std', 'flight_time_min', 'flight_time_max',
        'key_press_variance', 'rhythm_variance', 'backspace_frequency', 'consistency_score',
      ];

      optionalFeatures.forEach((key) => {
        const value = data[key];
        if (value !== undefined && value !== null) {
          payload[key] = value;
        }
      });

      console.log('📤 Typing payload:', {
        keystrokes_count: payload.keystrokes.length,
        text_typed_length: payload.text_typed.length,
        extra_features: optionalFeatures.filter((k) => data[k] !== undefined).length,
      });

      const response = await api.post('/typing/assess', payload);
      return response.data;
    } catch (error) {
      console.error('Typing assessment error:', error);
      throw error;
    }
  },

  /**
   * Get typing assessment history for a user.
   */
  getHistory: async (userId: number) => {
    try {
      const response = await api.get(`/typing/history/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching typing history:', error);
      throw error;
    }
  },

  /**
   * Get latest typing assessment for current user.
   */
  getLatest: async () => {
    try {
      const response = await api.get('/typing/latest');
      return response.data;
    } catch (error) {
      console.error('Error fetching latest typing:', error);
      throw error;
    }
  },

  /**
   * ✅ NEW: Get typing trend over weeks.
   */
  getTrend: async (userId: number, weeks: number = 12) => {
    try {
      const response = await api.get(`/typing/trend/${userId}`, {
        params: { weeks },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching typing trend:', error);
      throw error;
    }
  },
};