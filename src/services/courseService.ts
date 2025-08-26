import { supabase } from '@/integrations/supabase/client';

export interface Course {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration: number;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CourseVideo {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  video_url: string;
  video_type: 'file' | 'url';
  duration?: number;
  order_index: number;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
}

// Cache for course data to improve performance
const courseCache = new Map<string, { data: any; timestamp: number }>();
const videoCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to get cached data or fetch fresh data
async function getCachedOrFetch<T>(
  cacheKey: string,
  cache: Map<string, { data: any; timestamp: number }>,
  fetchFunction: () => Promise<T>
): Promise<T> {
  const cached = cache.get(cacheKey);
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
  }
  
  try {
    const data = await fetchFunction();
    cache.set(cacheKey, { data, timestamp: now });
    return data;
  } catch (error) {
    // If fetch fails and we have cached data, return it even if expired
    if (cached) {
      console.warn('Fetch failed, using expired cache:', error);
      return cached.data;
    }
    throw error;
  }
}

export const courseService = {
  // Fetch all courses with caching
  async fetchCourses(): Promise<Course[]> {
    const cacheKey = 'all_courses';
    
    return getCachedOrFetch(cacheKey, courseCache, async () => {
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching courses:', error);
          throw new Error(`Failed to fetch courses: ${error.message}`);
        }

        return data || [];
      } catch (error) {
        console.error('Error in fetchCourses:', error);
        throw error;
      }
    });
  },

  // Fetch videos by course with caching
  async fetchVideosByCourse(courseId: string): Promise<CourseVideo[]> {
    const cacheKey = `videos_${courseId}`;
    
    return getCachedOrFetch(cacheKey, videoCache, async () => {
      try {
        const { data, error } = await supabase
          .from('course_videos')
          .select('*')
          .eq('course_id', courseId)
          .order('order_index', { ascending: true });

        if (error) {
          console.error(`Error fetching videos for course ${courseId}:`, error);
          throw new Error(`Failed to fetch videos: ${error.message}`);
        }

        return data || [];
      } catch (error) {
        console.error('Error in fetchVideosByCourse:', error);
        throw error;
      }
    });
  },

  // Fetch single course with caching
  async fetchCourse(courseId: string): Promise<Course | null> {
    const cacheKey = `course_${courseId}`;
    
    return getCachedOrFetch(cacheKey, courseCache, async () => {
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();

        if (error) {
          console.error(`Error fetching course ${courseId}:`, error);
          throw new Error(`Failed to fetch course: ${error.message}`);
        }

        return data;
      } catch (error) {
        console.error('Error in fetchCourse:', error);
        throw error;
      }
    });
  },

  // Fetch single video with caching
  async fetchVideo(videoId: string): Promise<CourseVideo | null> {
    const cacheKey = `video_${videoId}`;
    
    return getCachedOrFetch(cacheKey, videoCache, async () => {
      try {
        const { data, error } = await supabase
          .from('course_videos')
          .select('*')
          .eq('id', videoId)
          .single();

        if (error) {
          console.error(`Error fetching video ${videoId}:`, error);
          throw new Error(`Failed to fetch video: ${error.message}`);
        }

        return data;
      } catch (error) {
        console.error('Error in fetchVideo:', error);
        throw error;
      }
    });
  },

  // Fetch courses by category with caching
  async fetchCoursesByCategory(category: string): Promise<Course[]> {
    const cacheKey = `courses_category_${category}`;
    
    return getCachedOrFetch(cacheKey, courseCache, async () => {
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('category', category)
          .order('created_at', { ascending: false });

        if (error) {
          console.error(`Error fetching courses for category ${category}:`, error);
          throw new Error(`Failed to fetch courses: ${error.message}`);
        }

        return data || [];
      } catch (error) {
        console.error('Error in fetchCoursesByCategory:', error);
        throw error;
      }
    });
  },

  // Fetch courses by difficulty with caching
  async fetchCoursesByDifficulty(difficulty: string): Promise<Course[]> {
    const cacheKey = `courses_difficulty_${difficulty}`;
    
    return getCachedOrFetch(cacheKey, courseCache, async () => {
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('difficulty', difficulty)
          .order('created_at', { ascending: false });

        if (error) {
          console.error(`Error fetching courses for difficulty ${difficulty}:`, error);
          throw new Error(`Failed to fetch courses: ${error.message}`);
        }

        return data || [];
      } catch (error) {
        console.error('Error in fetchCoursesByDifficulty:', error);
        throw error;
      }
    });
  },

  // Search courses with caching
  async searchCourses(query: string): Promise<Course[]> {
    const cacheKey = `search_${query.toLowerCase()}`;
    
    return getCachedOrFetch(cacheKey, courseCache, async () => {
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
          .order('created_at', { ascending: false });

        if (error) {
          console.error(`Error searching courses for query "${query}":`, error);
          throw new Error(`Failed to search courses: ${error.message}`);
        }

        return data || [];
      } catch (error) {
        console.error('Error in searchCourses:', error);
        throw error;
      }
    });
  },

  // Clear cache for specific course (useful when data changes)
  clearCourseCache(courseId?: string): void {
    if (courseId) {
      courseCache.delete(`course_${courseId}`);
      videoCache.delete(`videos_${courseId}`);
    } else {
      courseCache.clear();
      videoCache.clear();
    }
  },

  // Add course (clears cache after adding)
  async addCourse(course: Omit<Course, 'id' | 'created_at' | 'updated_at'>): Promise<Course> {
    try {
      console.log('Adding course:', course);
      
      const { data, error } = await supabase
        .from('courses')
        .insert(course)
        .select('*')
        .single();

      if (error) {
        console.error('Error adding course:', error);
        throw new Error(`Failed to add course: ${error.message}`);
      }

      // Clear cache after adding new course
      this.clearCourseCache();
      
      return data;
    } catch (error) {
      console.error('Error in addCourse:', error);
      throw error;
    }
  },

  // Update course (clears cache after updating)
  async updateCourse(courseId: string, updates: Partial<Course>): Promise<Course> {
    try {
      console.log(`Updating course ${courseId} with:`, updates);
      
      const { data, error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', courseId)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating course:', error);
        throw new Error(`Failed to update course: ${error.message}`);
      }

      // Clear cache for this specific course
      this.clearCourseCache(courseId);
      
      return data;
    } catch (error) {
      console.error('Error in updateCourse:', error);
      throw error;
    }
  },

  // Add video (clears cache after adding)
  async addVideo(video: Omit<CourseVideo, 'id' | 'created_at' | 'updated_at'>): Promise<CourseVideo> {
    try {
      console.log('Adding video:', video);
      
      const { data, error } = await supabase
        .from('course_videos')
        .insert(video)
        .select('*')
        .single();

      if (error) {
        console.error('Error adding video:', error);
        throw new Error(`Failed to add video: ${error.message}`);
      }

      // Clear cache for this course's videos
      this.clearCourseCache(video.course_id);
      
      return data;
    } catch (error) {
      console.error('Error in addVideo:', error);
      throw error;
    }
  },

  // Update video (clears cache after updating)
  async updateVideo(videoId: string, updates: Partial<CourseVideo>): Promise<CourseVideo> {
    try {
      console.log(`Updating video ${videoId}:`, updates);
      
      const { data, error } = await supabase
        .from('course_videos')
        .update(updates)
        .eq('id', videoId)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating video:', error);
        throw new Error(`Failed to update video: ${error.message}`);
      }

      // Clear cache for this course's videos
      if (data.course_id) {
        this.clearCourseCache(data.course_id);
      }
      
      return data;
    } catch (error) {
      console.error('Error in updateVideo:', error);
      throw error;
    }
  },

  // Delete video (clears cache after deleting)
  async deleteVideo(videoId: string): Promise<void> {
    try {
      console.log(`Deleting video ${videoId}`);
      
      // Get course_id before deleting for cache clearing
      const video = await this.fetchVideo(videoId);
      
      const { error } = await supabase
        .from('course_videos')
        .delete()
        .eq('id', videoId);

      if (error) {
        console.error('Error deleting video:', error);
        throw new Error(`Failed to delete video: ${error.message}`);
      }

      // Clear cache for this course's videos
      if (video?.course_id) {
        this.clearCourseCache(video.course_id);
      }
    } catch (error) {
      console.error('Error in deleteVideo:', error);
      throw error;
    }
  },

  // Delete course (clears cache after deleting)
  async deleteCourse(courseId: string): Promise<void> {
    try {
      console.log(`Deleting course ${courseId}`);
      
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) {
        console.error('Error deleting course:', error);
        throw new Error(`Failed to delete course: ${error.message}`);
      }

      // Clear cache for this course
      this.clearCourseCache(courseId);
    } catch (error) {
      console.error('Error in deleteCourse:', error);
      throw error;
    }
  },
};
