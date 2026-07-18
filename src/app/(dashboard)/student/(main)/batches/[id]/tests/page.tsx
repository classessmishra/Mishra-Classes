"use client";

export default function BatchTestsPage() {
  return (
    <div className="p-6 text-center">
      <div className="w-16 h-16 bg-muted mx-auto rounded-full flex items-center justify-center mb-4 mt-12">
        <span className="text-2xl">📝</span>
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">No active tests</h3>
      <p className="text-muted-foreground max-w-sm mx-auto">
        There are currently no tests assigned for this batch. Check back later!
      </p>
    </div>
  );
}
