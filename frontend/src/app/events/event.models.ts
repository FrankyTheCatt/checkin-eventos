export interface EventPayload {
  title: string;
  description: string;
  location_name: string;
  latitude: number | null;
  longitude: number | null;
  radius_m: number;
  starts_at: string;
  ends_at: string;
}

export interface EventRecord extends EventPayload {
  id: number;
  owner_id: number;
  qr_code: string;
  attendance_count: number;
}

export interface Attendance {
  id: number;
  event_id: number;
  user_id: number;
  checked_in_at: string;
  latitude: number | null;
  longitude: number | null;
}
