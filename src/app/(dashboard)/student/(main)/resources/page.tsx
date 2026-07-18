export default function StudentResourcesPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Study Resources</h1>
        <p className="text-muted-foreground">Access PDFs, recorded lectures, and notes.</p>
      </div>
      <div className="bg-card p-12 rounded-2xl border border-border text-center">
        <p className="text-muted-foreground">No resources uploaded by the admin yet.</p>
      </div>
    </div>
  );
}
