import { createClient } from "npm:@supabase/supabase-js@2.39.0";
import { load } from "npm:cheerio@1.0.0-rc.12";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
}

function extractPlaylistId(url: string): string | null {
  const regex = /[?&]list=([^&]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

async function fetchContinuation(cToken: string): Promise<any> {
  const response = await fetch("https://www.youtube.com/youtubei/v1/browse?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-YouTube-Client-Name": "1",
      "X-YouTube-Client-Version": "2.20240221.05.00",
    },
    body: JSON.stringify({
      continuation: cToken,
      context: {
        client: {
          clientName: "WEB",
          clientVersion: "2.20240221.05.00",
        },
      },
    }),
  });

  return await response.json();
}

async function getAllVideos(initialData: any): Promise<Video[]> {
  let videos: Video[] = [];
  let items = initialData?.contents?.twoColumnBrowseResultsRenderer
    ?.tabs[0]?.tabRenderer?.content?.sectionListRenderer
    ?.contents[0]?.itemSectionRenderer?.contents[0]
    ?.playlistVideoListRenderer?.contents || [];

  // Process initial items
  items.forEach((item: any) => {
    if (item.playlistVideoRenderer) {
      const video = item.playlistVideoRenderer;
      videos.push({
        id: video.videoId,
        title: video.title.runs[0].text,
        thumbnail: `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`,
        channelTitle: video.shortBylineText.runs[0].text,
        publishedAt: video.publishedTimeText?.simpleText || 'Unknown date'
      });
    }
  });

  // Get continuation token
  let continuationToken = items[items.length - 1]?.continuationItemRenderer
    ?.continuationEndpoint?.continuationCommand?.token;

  // Fetch remaining videos
  while (continuationToken) {
    const data = await fetchContinuation(continuationToken);
    const newItems = data?.onResponseReceivedActions?.[0]
      ?.appendContinuationItemsAction?.continuationItems || [];

    // Process new items
    newItems.forEach((item: any) => {
      if (item.playlistVideoRenderer) {
        const video = item.playlistVideoRenderer;
        videos.push({
          id: video.videoId,
          title: video.title.runs[0].text,
          thumbnail: `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`,
          channelTitle: video.shortBylineText.runs[0].text,
          publishedAt: video.publishedTimeText?.simpleText || 'Unknown date'
        });
      }
    });

    // Get next continuation token
    continuationToken = newItems[newItems.length - 1]?.continuationItemRenderer
      ?.continuationEndpoint?.continuationCommand?.token;
  }

  return videos;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const playlistUrl = url.searchParams.get("url");

    if (!playlistUrl) {
      return new Response(
        JSON.stringify({ error: "Playlist URL is required" }),
        { 
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        }
      );
    }

    const playlistId = extractPlaylistId(playlistUrl);
    if (!playlistId) {
      return new Response(
        JSON.stringify({ error: "Invalid playlist URL" }),
        { 
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        }
      );
    }

    // Fetch playlist page
    const response = await fetch(`https://www.youtube.com/playlist?list=${playlistId}`);
    const html = await response.text();
    
    // Parse HTML
    const $ = load(html);
    
    // Extract video data from script tags
    const scripts = $('script').map((_, el) => $(el).html()).get();
    const ytInitialData = scripts
      .find(script => script?.includes('ytInitialData'))
      ?.match(/ytInitialData\s*=\s*({.+?});/)?.[1];

    if (!ytInitialData) {
      throw new Error('Could not extract playlist data');
    }

    const data = JSON.parse(ytInitialData);
    const videos = await getAllVideos(data);

    return new Response(
      JSON.stringify(videos),
      { 
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  }
});