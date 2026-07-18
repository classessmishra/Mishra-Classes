"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import CourseCard from "@/components/CourseCard";
import { getCourses } from "@/actions/courses";

export default function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    async function fetch() {
      const data = await getCourses();
      setCourses(data);
    }
    fetch();
  }, []);

  return (
    <motion.main
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8 max-w-7xl"
    >
      <div className="mb-12 text-center md:text-left">
        <h1 className="text-4xl font-extrabold text-foreground mb-4">All Courses</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Explore our premium English coaching programs designed for academic excellence and fluent communication.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {courses.map((course, idx) => (
          <CourseCard
            key={idx}
            id={course.id}
            title={course.title}
            instructor={"Prof. A. Mishra"} // Dummy instructor since it's not in schema
            duration={"Access for 1 Year"}
            price={course.price}
            badge={course.is_live ? "LIVE" : "RECORDED"}
            imageUrl={course.thumbnail_url || "/images/course_thumb.png"}
          />
        ))}
      </div>
    </motion.main>
  );
}
