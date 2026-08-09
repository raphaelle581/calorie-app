import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vvuwagddyrlbsozbkmtt.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2dXdhZ2RkeXJsYnNvemJrbXR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMTYyMDIsImV4cCI6MjEwMTU5MjIwMn0.rjKDm9f59eCd0SJGUrKmN1oRuMb0DubnYEKjMr6ETFE";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
