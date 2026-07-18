"use client";
import { useState, useEffect } from "react";
import { MessageSquare, BellRing, Megaphone, Link as LinkIcon } from "lucide-react";
import { createChatGroup, sendGlobalNotification } from "@/actions/chat";
import { createBatchAnnouncement } from "@/actions/announcements";
import { getBatches } from "@/actions/batches";

export default function CommunicationsPage() {
  const [groupName, setGroupName] = useState("");
  const [isGlobal, setIsGlobal] = useState(false);
  const [loadingGroup, setLoadingGroup] = useState(false);

  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifLink, setNotifLink] = useState("");
  const [loadingNotif, setLoadingNotif] = useState(false);

  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [batchAnnTitle, setBatchAnnTitle] = useState("");
  const [batchAnnMessage, setBatchAnnMessage] = useState("");
  const [batchAnnLink, setBatchAnnLink] = useState("");
  const [loadingBatchAnn, setLoadingBatchAnn] = useState(false);

  useEffect(() => {
    getBatches().then(data => setBatches(data));
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingGroup(true);
    try {
      await createChatGroup(groupName, isGlobal);
      alert("Chat group created!");
      setGroupName("");
      setIsGlobal(false);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoadingGroup(false);
    }
  };

  const handleSendNotif = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingNotif(true);
    try {
      await sendGlobalNotification(notifTitle, notifMessage, notifLink);
      alert("Global Push notification sent to all students!");
      setNotifTitle("");
      setNotifMessage("");
      setNotifLink("");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoadingNotif(false);
    }
  };

  const handleSendBatchAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) {
      alert("Please select a batch first.");
      return;
    }
    setLoadingBatchAnn(true);
    try {
      await createBatchAnnouncement(selectedBatch, batchAnnTitle, batchAnnMessage, batchAnnLink);
      alert("Announcement posted to the batch successfully!");
      setBatchAnnTitle("");
      setBatchAnnMessage("");
      setBatchAnnLink("");
      setSelectedBatch("");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoadingBatchAnn(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Communication Hub</h1>
        <p className="text-muted-foreground">Manage push notifications and chat groups.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Chat Group Creator */}
        <form onSubmit={handleCreateGroup} className="bg-card p-6 rounded-2xl border border-border space-y-4">
          <div className="flex items-center gap-3 mb-4 text-primary">
            <MessageSquare size={24} />
            <h2 className="font-bold text-lg text-foreground">Create Chat Group</h2>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Group Name</label>
            <input 
              required 
              type="text" 
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full p-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/50 outline-none" 
              placeholder="e.g. 10th English Doubts"
            />
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="isGlobal"
              checked={isGlobal}
              onChange={(e) => setIsGlobal(e.target.checked)}
              className="w-4 h-4 text-primary rounded border-border"
            />
            <label htmlFor="isGlobal" className="text-sm font-medium">Make it a Global Room</label>
          </div>
          <button 
            disabled={loadingGroup || !groupName}
            type="submit" 
            className="bg-primary text-white px-4 py-2 rounded-xl font-bold w-full hover:bg-primary/90 disabled:opacity-50"
          >
            {loadingGroup ? "Creating..." : "Create Group"}
          </button>
        </form>

        {/* Push Notification Sender */}
        <form onSubmit={handleSendNotif} className="bg-card p-6 rounded-2xl border border-border space-y-4">
          <div className="flex items-center gap-3 mb-4 text-orange-500">
            <BellRing size={24} />
            <h2 className="font-bold text-lg text-foreground">Send Push Notification</h2>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input 
              required 
              type="text" 
              value={notifTitle}
              onChange={(e) => setNotifTitle(e.target.value)}
              className="w-full p-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/50 outline-none" 
              placeholder="e.g. Class Rescheduled"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea 
              required
              value={notifMessage}
              onChange={(e) => setNotifMessage(e.target.value)}
              className="w-full p-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/50 outline-none resize-none h-24" 
              placeholder="Enter your message here..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Link URL (Optional)</label>
            <input 
              type="url" 
              value={notifLink}
              onChange={(e) => setNotifLink(e.target.value)}
              className="w-full p-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/50 outline-none" 
              placeholder="https://example.com"
            />
          </div>
          <button 
            disabled={loadingNotif || !notifTitle || !notifMessage}
            type="submit" 
            className="bg-orange-500 text-white px-4 py-2 rounded-xl font-bold w-full hover:bg-orange-600 disabled:opacity-50"
          >
            {loadingNotif ? "Sending..." : "Send Global Notification"}
          </button>
        </form>

        {/* Batch Announcement Sender */}
        <form onSubmit={handleSendBatchAnnouncement} className="bg-card p-6 rounded-2xl border border-border space-y-4">
          <div className="flex items-center gap-3 mb-4 text-green-600">
            <Megaphone size={24} />
            <h2 className="font-bold text-lg text-foreground">Post Batch Announcement</h2>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Select Batch</label>
            <select 
              required
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full p-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/50 outline-none"
            >
              <option value="">-- Choose a batch --</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input 
              required 
              type="text" 
              value={batchAnnTitle}
              onChange={(e) => setBatchAnnTitle(e.target.value)}
              className="w-full p-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/50 outline-none" 
              placeholder="e.g. Test Result Declared"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea 
              required
              value={batchAnnMessage}
              onChange={(e) => setBatchAnnMessage(e.target.value)}
              className="w-full p-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/50 outline-none resize-none h-24" 
              placeholder="Write the announcement..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Attachment Link (Optional)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <LinkIcon size={18} />
              </div>
              <input 
                type="url" 
                value={batchAnnLink}
                onChange={(e) => setBatchAnnLink(e.target.value)}
                className="w-full p-3 pl-10 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/50 outline-none" 
                placeholder="https://drive.google.com/..."
              />
            </div>
          </div>
          <button 
            disabled={loadingBatchAnn || !batchAnnTitle || !batchAnnMessage || !selectedBatch}
            type="submit" 
            className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold w-full hover:bg-green-700 disabled:opacity-50"
          >
            {loadingBatchAnn ? "Posting..." : "Post Announcement"}
          </button>
        </form>
      </div>
    </div>
  );
}
