"use client";

import { useEffect, useRef, useState } from "react";

interface LivePlayerProps {
  videoId: string;
  isMuted?: boolean;
  controls?: boolean;
}

export default function LivePlayer({ videoId, isMuted = false, controls = false }: LivePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Load YouTube IFrame API if not already loaded
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      if (!containerRef.current) return;
      
      // Empty the container if re-initializing
      containerRef.current.innerHTML = '<div id="yt-player-target"></div>';

      playerRef.current = new window.YT.Player("yt-player-target", {
        videoId: videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 1,
          mute: isMuted ? 1 : 0,
          controls: controls ? 1 : 0,
          disablekb: controls ? 0 : 1,
          fs: 0, // Disable native full screen (we use custom container full screen)
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          playsinline: 1,
          origin: typeof window !== "undefined" ? window.location.origin : "",
        },
        events: {
          onReady: (event: any) => {
            setIsReady(true);
            
            // Apply initial mute state
            if (isMuted) {
              event.target.mute();
            } else {
              event.target.unMute();
            }
            
            event.target.playVideo();
          },
          onStateChange: (event: any) => {
            // We removed the aggressive force play that caused flashing UI
            // YouTube handles its own buffering gracefully enough now.
            // Only if it actually stops (0) do we try to play again.
            if (event.data === 0 && !controls) {
              event.target.playVideo();
            }
          }
        }
      });
    };

    // Wait for YT API to be ready
    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
      window.onYouTubeIframeAPIReady = null;
    };
  }, [videoId, controls]); // Re-init if controls change

  // Handle dynamic mute toggling without reloading the iframe
  useEffect(() => {
    if (playerRef.current && isReady) {
      if (isMuted) {
        playerRef.current.mute();
      } else {
        playerRef.current.unMute();
      }
    }
  }, [isMuted, isReady]);



  return (
    <div className="w-full h-full relative overflow-hidden bg-black flex items-center justify-center">
      {!isReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-wider animate-pulse">Connecting to Premium Stream...</p>
        </div>
      )}
      
      <div 
        ref={containerRef} 
        className={`absolute inset-0 w-full h-full ${controls ? '' : 'pointer-events-none'}`}
      >
        <div id="yt-player-target"></div>
      </div>
    </div>
  );
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: any;
  }
}
