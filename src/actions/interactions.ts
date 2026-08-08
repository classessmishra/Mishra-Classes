"use server";

import { createClient } from "@/utils/supabase/server";

// 1. Get stats
export async function getCourseInteractions(courseId: string, userId?: string) {
  const supabase = await createClient();
  
  try {
    // Get Likes
    const { count: likesCount } = await supabase
      .from("course_likes")
      .select("*", { count: 'exact', head: true })
      .eq("course_id", courseId);
      
    // Get Ratings
    const { data: ratingsData } = await supabase
      .from("course_ratings")
      .select("rating")
      .eq("course_id", courseId);
      
    const ratingsCount = ratingsData?.length || 0;
    const ratingsAvg = ratingsCount > 0 
      ? (ratingsData!.reduce((acc, curr) => acc + curr.rating, 0) / ratingsCount).toFixed(1)
      : "0.0";
      
    // Get User specific
    let isLiked = false;
    let userRating = 0;
    
    if (userId) {
      const { data: userLike } = await supabase
        .from("course_likes")
        .select("id")
        .eq("course_id", courseId)
        .eq("user_id", userId)
        .single();
        
      isLiked = !!userLike;
      
      const { data: userRatingData } = await supabase
        .from("course_ratings")
        .select("rating")
        .eq("course_id", courseId)
        .eq("user_id", userId)
        .single();
        
      if (userRatingData) {
        userRating = userRatingData.rating;
      }
    }
    
    return {
      likesCount: likesCount || 0,
      ratingsAvg,
      ratingsCount,
      isLiked,
      userRating
    };
  } catch (error) {
    console.error("Error fetching interactions:", error);
    return {
      likesCount: 0,
      ratingsAvg: "0.0",
      ratingsCount: 0,
      isLiked: false,
      userRating: 0
    };
  }
}

// 2. Toggle Like
export async function toggleLikeCourse(courseId: string, userId: string, isLiked: boolean) {
  const supabase = await createClient();
  try {
    if (isLiked) {
      // Remove Like
      await supabase
        .from("course_likes")
        .delete()
        .eq("course_id", courseId)
        .eq("user_id", userId);
    } else {
      // Add Like
      await supabase
        .from("course_likes")
        .insert({
          course_id: courseId,
          user_id: userId
        });
    }
    return { success: true };
  } catch (error) {
    console.error("Error toggling like:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to toggle like" };
  }
}

// 3. Rate Course
export async function rateCourse(courseId: string, userId: string, rating: number) {
  const supabase = await createClient();
  try {
    // Check if exists
    const { data: existing } = await supabase
      .from("course_ratings")
      .select("id")
      .eq("course_id", courseId)
      .eq("user_id", userId)
      .single();
      
    if (existing) {
      // Update
      await supabase
        .from("course_ratings")
        .update({ rating })
        .eq("id", existing.id);
    } else {
      // Insert
      await supabase
        .from("course_ratings")
        .insert({
          course_id: courseId,
          user_id: userId,
          rating
        });
    }
    return { success: true };
  } catch (error) {
    console.error("Error rating course:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to rate course" };
  }
}
