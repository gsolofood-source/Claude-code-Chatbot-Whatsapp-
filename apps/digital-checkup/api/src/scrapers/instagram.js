/**
 * Scrapes Instagram profile data and recent posts using direct API approach
 * @param {string} username - Instagram username (without @)
 * @returns {Promise<Object>} Profile data with posts
 */
export async function scrapeProfile(username) {
  try {
    // Instagram's public web API endpoint
    const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'X-IG-App-ID': '936619743392459',
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': `https://www.instagram.com/${username}/`,
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin'
    };

    const response = await fetch(url, { headers });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Profile not found. Check if the username is correct.');
      }
      if (response.status === 401) {
        throw new Error('Instagram blocked this request. This happens when: 1) Too many requests in short time, 2) IP temporarily blocked. Wait 15-30 minutes and try again. Consider using analyze_global without Instagram parameter.');
      }
      if (response.status === 429) {
        throw new Error('Rate limit reached. Please wait 1-2 hours before trying again.');
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.data || !data.data.user) {
      throw new Error('Invalid response from Instagram. Profile may be private or restricted.');
    }

    const user = data.data.user;

    // Check if profile is private
    if (user.is_private) {
      throw new Error('This profile is private and cannot be analyzed.');
    }

    // Extract posts from edge_owner_to_timeline_media
    const timelineMedia = user.edge_owner_to_timeline_media;
    const edges = timelineMedia?.edges || [];

    const posts = edges.slice(0, 12).map(edge => {
      const node = edge.node;

      // Determine post type based on __typename
      let type = 'photo'; // default
      if (node.__typename === 'GraphVideo') {
        type = 'video';
      } else if (node.__typename === 'GraphSidecar') {
        type = 'carousel';
      } else if (node.__typename === 'GraphImage') {
        type = 'photo';
      }

      return {
        id: node.id,
        shortcode: node.shortcode,
        caption: node.edge_media_to_caption?.edges?.[0]?.node?.text || '',
        likes: node.edge_liked_by?.count || node.edge_media_preview_like?.count || 0,
        comments: node.edge_media_to_comment?.count || 0,
        timestamp: node.taken_at_timestamp,
        type: type,
        imageUrl: node.display_url,
        videoUrl: node.is_video ? node.video_url : null
      };
    }).sort((a, b) => b.timestamp - a.timestamp); // Sort by date descending (newest first)

    return {
      username: user.username,
      fullName: user.full_name || '',
      biography: user.biography || '',
      followers: user.edge_followed_by?.count || 0,
      following: user.edge_follow?.count || 0,
      postsCount: timelineMedia?.count || 0,
      isVerified: user.is_verified || false,
      isPrivate: user.is_private || false,
      profilePicUrl: user.profile_pic_url_hd || user.profile_pic_url,
      externalUrl: user.external_url || null,
      posts
    };

  } catch (error) {
    if (error.message.includes('fetch')) {
      throw new Error(`Network error: Unable to connect to Instagram. Check your internet connection.`);
    }
    throw new Error(`Failed to scrape profile @${username}: ${error.message}`);
  }
}

/**
 * Calculates basic engagement metrics from scraped data
 * @param {Object} profileData - Scraped profile data
 * @returns {Object} Basic metrics
 */
export function calculateBasicMetrics(profileData) {
  const { followers, posts } = profileData;

  if (!posts || posts.length === 0) {
    return {
      engagementRate: 0,
      avgLikes: 0,
      avgComments: 0,
      contentMix: { photo: 0, video: 0, carousel: 0 }
    };
  }

  // Calculate average engagement
  const totalLikes = posts.reduce((sum, post) => sum + (post.likes || 0), 0);
  const totalComments = posts.reduce((sum, post) => sum + (post.comments || 0), 0);
  const avgLikes = totalLikes / posts.length;
  const avgComments = totalComments / posts.length;

  // Engagement rate: (avg likes + avg comments) / followers * 100
  const engagementRate = followers > 0
    ? ((avgLikes + avgComments) / followers) * 100
    : 0;

  // Content mix analysis
  const contentMix = posts.reduce((mix, post) => {
    mix[post.type] = (mix[post.type] || 0) + 1;
    return mix;
  }, { photo: 0, video: 0, carousel: 0 });

  // Convert to percentages
  Object.keys(contentMix).forEach(key => {
    contentMix[key] = (contentMix[key] / posts.length) * 100;
  });

  return {
    engagementRate: Math.round(engagementRate * 100) / 100,
    avgLikes: Math.round(avgLikes),
    avgComments: Math.round(avgComments),
    contentMix
  };
}
