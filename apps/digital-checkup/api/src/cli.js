#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import dotenv from 'dotenv';

// Import services (unified business logic)
import { analyzeReputation } from './services/reputation-service.js';
import { analyzeInstagram, inspectInstagram } from './services/instagram-service.js';
import { analyzeWebsite } from './services/website-service.js';
import { analyzeGMB } from './services/gmb-service.js';
import { analyzeGlobal } from './services/global-service.js';

// Import utility/formatter functions for CLI display
import { getRatingLabel } from './scorers/calculator.js';
import { getRatingLabel as getRepRatingLabel } from './scorers/reputation-calculator.js';
import { getGMBRatingLabel } from './analyzers/gmb-analyzer.js';
import { generateTrendDescription } from './analyzers/trend-analyzer.js';
import { getRiskLevelLabel, getPillarEmoji } from './scorers/global-calculator.js';

// Load environment variables
dotenv.config();

const program = new Command();

program
  .name('ig-check')
  .description('AI-powered digital presence analyzer: Instagram, Websites, Reputation & Google My Business')
  .version('3.0.0');

program
  .command('inspect')
  .description('Inspect Instagram profile posts with detailed metadata')
  .argument('<username>', 'Instagram username (without @)')
  .action(async (username) => {
    console.log(chalk.blue.bold(`\n🔍 Inspecting Instagram profile: @${username}\n`));

    const spinner = ora('Fetching profile data...').start();
    let profileData;
    try {
      profileData = await scrapeProfile(username);
      spinner.succeed(chalk.green('Profile data fetched'));
    } catch (error) {
      spinner.fail(chalk.red('Failed to fetch profile'));
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }

    // Display profile header
    console.log(chalk.blue('\n' + '='.repeat(80)));
    console.log(chalk.blue.bold('📋 PROFILE OVERVIEW'));
    console.log(chalk.blue('='.repeat(80) + '\n'));
    console.log(chalk.bold('Username:'), chalk.cyan(`@${profileData.username}`));
    if (profileData.fullName) {
      console.log(chalk.bold('Name:'), profileData.fullName);
    }
    console.log(chalk.bold('Followers:'), profileData.followers.toLocaleString());
    console.log(chalk.bold('Following:'), profileData.following.toLocaleString());
    console.log(chalk.bold('Total Posts:'), profileData.postsCount.toLocaleString());
    if (profileData.biography) {
      console.log(chalk.bold('Bio:'), chalk.gray(profileData.biography.substring(0, 100) + (profileData.biography.length > 100 ? '...' : '')));
    }

    // Display posts
    console.log(chalk.blue('\n' + '='.repeat(80)));
    console.log(chalk.blue.bold(`📸 RECENT POSTS (${profileData.posts.length})`));
    console.log(chalk.blue('='.repeat(80) + '\n'));

    profileData.posts.forEach((post, index) => {
      // Post type icon
      let typeIcon = '📷';
      let typeColor = chalk.cyan;
      if (post.type === 'video') {
        typeIcon = '🎬';
        typeColor = chalk.magenta;
      } else if (post.type === 'carousel') {
        typeIcon = '🎞️';
        typeColor = chalk.yellow;
      }

      // Format date
      const date = new Date(post.timestamp * 1000);
      const formattedDate = date.toLocaleDateString('it-IT', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Display post info
      console.log(chalk.bold(`${index + 1}. ${typeIcon} ${typeColor(post.type.toUpperCase())}`));
      console.log(chalk.gray(`   📅 ${formattedDate}`));
      console.log(chalk.gray(`   🔗 https://instagram.com/p/${post.shortcode}`));
      console.log(chalk.white(`   ❤️  ${post.likes.toLocaleString()} likes  💬 ${post.comments.toLocaleString()} comments`));

      if (post.caption) {
        const captionPreview = post.caption.length > 120
          ? post.caption.substring(0, 120) + '...'
          : post.caption;
        console.log(chalk.gray(`   📝 ${captionPreview.replace(/\n/g, ' ')}`));
      } else {
        console.log(chalk.gray('   📝 (no caption)'));
      }
      console.log();
    });

    // Content mix summary
    const contentMix = profileData.posts.reduce((mix, post) => {
      mix[post.type] = (mix[post.type] || 0) + 1;
      return mix;
    }, { photo: 0, video: 0, carousel: 0 });

    console.log(chalk.blue('='.repeat(80)));
    console.log(chalk.bold.blue('📊 CONTENT MIX SUMMARY\n'));
    console.log(`📷 Photos: ${contentMix.photo} (${Math.round(contentMix.photo / profileData.posts.length * 100)}%)`);
    console.log(`🎬 Videos: ${contentMix.video} (${Math.round(contentMix.video / profileData.posts.length * 100)}%)`);
    console.log(`🎞️  Carousels: ${contentMix.carousel} (${Math.round(contentMix.carousel / profileData.posts.length * 100)}%)`);
    console.log(chalk.blue('\n' + '='.repeat(80) + '\n'));
  });

program
  .command('analyze')
  .description('Analyze an Instagram profile and generate a quality score')
  .argument('<username>', 'Instagram username (without @)')
  .option('-v, --verbose', 'Show detailed analysis')
  .action(async (username, options) => {
    // Validate API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error(chalk.red('❌ Error: ANTHROPIC_API_KEY not found'));
      console.log(chalk.yellow('\nPlease create a .env file with your Anthropic API key:'));
      console.log(chalk.cyan('ANTHROPIC_API_KEY=your_key_here'));
      console.log(chalk.yellow('\nGet your API key from: https://console.anthropic.com/'));
      process.exit(1);
    }

    console.log(chalk.blue.bold(`\n🔍 Analyzing Instagram profile: @${username}\n`));

    // Step 1: Scrape profile
    const scrapeSpinner = ora('Scraping profile data...').start();
    let profileData;
    try {
      profileData = await scrapeProfile(username);
      scrapeSpinner.succeed(chalk.green('Profile data collected'));
    } catch (error) {
      scrapeSpinner.fail(chalk.red('Failed to scrape profile'));
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }

    // Step 2: Calculate basic metrics
    const metricsSpinner = ora('Calculating engagement metrics...').start();
    const basicMetrics = calculateBasicMetrics(profileData);
    basicMetrics.followers = profileData.followers;
    metricsSpinner.succeed(chalk.green('Metrics calculated'));

    // Step 3: AI Analysis
    console.log(chalk.blue('\n🤖 Running AI analysis...\n'));

    const copySpinner = ora('Analyzing copywriting quality...').start();
    const copywriting = await analyzeCopywriting(profileData.posts, apiKey);
    copySpinner.succeed(chalk.green('Copywriting analyzed'));

    const visualSpinner = ora('Analyzing visual identity...').start();
    const visualIdentity = await analyzeVisualIdentity(profileData, apiKey);
    visualSpinner.succeed(chalk.green('Visual identity analyzed'));

    const originalitySpinner = ora('Analyzing originality...').start();
    const originality = await analyzeOriginality(profileData, apiKey);
    originalitySpinner.succeed(chalk.green('Originality analyzed'));

    // Step 4: Calculate final score
    const scoreSpinner = ora('Calculating final score...').start();
    const aiAnalysis = { copywriting, visualIdentity, originality };
    const result = calculateFinalScore(basicMetrics, aiAnalysis);
    scoreSpinner.succeed(chalk.green('Score calculated'));

    // Step 5: Generate executive summary
    const summarySpinner = ora('Generating executive summary...').start();
    const summary = await generateExecutiveSummary(result, profileData, aiAnalysis, apiKey);
    summarySpinner.succeed(chalk.green('Executive summary generated'));

    // Display results
    console.log(chalk.blue('\n' + '='.repeat(60)));
    console.log(chalk.blue.bold('📊 ANALYSIS RESULTS'));
    console.log(chalk.blue('='.repeat(60) + '\n'));

    // Profile info
    console.log(chalk.bold('Profile:'), chalk.cyan(`@${profileData.username}`));
    if (profileData.fullName) {
      console.log(chalk.bold('Name:'), profileData.fullName);
    }
    console.log(chalk.bold('Followers:'), profileData.followers.toLocaleString());
    console.log(chalk.bold('Posts:'), profileData.postsCount.toLocaleString());
    console.log(chalk.bold('Engagement Rate:'), `${result.metrics.engagement_rate}%`);

    // Final score
    const rating = getRatingLabel(result.finalScore);
    let scoreColor = chalk.green;
    if (result.finalScore < 60) scoreColor = chalk.yellow;
    if (result.finalScore < 45) scoreColor = chalk.red;

    console.log(chalk.blue('\n' + '-'.repeat(60)));
    console.log(scoreColor.bold(`\n🎯 FINAL SCORE: ${result.finalScore}/100 (${rating})`));
    console.log(chalk.bold.cyan(`📌 Status: ${summary.status}\n`));
    console.log(chalk.blue('-'.repeat(60) + '\n'));

    // Executive Summary
    console.log(chalk.bold.blue('📋 EXECUTIVE SUMMARY\n'));

    if (summary.strongAreas.length > 0) {
      console.log(chalk.bold.green('✓ Strong Areas:'));
      summary.strongAreas.forEach(area => {
        console.log(chalk.green(`  • ${area}`));
      });
      console.log();
    }

    if (summary.weakAreas.length > 0) {
      console.log(chalk.bold.yellow('⚠ Areas for Improvement:'));
      summary.weakAreas.forEach(area => {
        console.log(chalk.yellow(`  • ${area}`));
      });
      console.log();
    }

    console.log(chalk.bold.cyan('💡 Recommendations:\n'));
    summary.recommendations.forEach((rec, i) => {
      console.log(chalk.cyan(`${i + 1}. ${rec}`));
    });

    console.log(chalk.blue('\n' + '-'.repeat(60) + '\n'));

    // Breakdown
    console.log(chalk.bold('Score Breakdown:\n'));

    const labels = {
      engagement_rate: 'Engagement Rate',
      follower_trend: 'Follower Trend',
      content_mix: 'Content Mix',
      copywriting: 'Copywriting Quality',
      visual_identity: 'Visual Identity',
      originality: 'Originality',
      qualitative_interactions: 'Interaction Quality'
    };

    for (const [key, data] of Object.entries(result.breakdown)) {
      const barLength = Math.round(data.score / 5);
      const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
      console.log(
        chalk.bold(labels[key].padEnd(25)),
        chalk.cyan(`${data.score}/100`),
        chalk.gray(`(weight: ${data.weight}%)`)
      );
      console.log(`  ${bar}`);
    }

    // Verbose mode: AI feedback
    if (options.verbose) {
      console.log(chalk.blue('\n' + '='.repeat(60)));
      console.log(chalk.blue.bold('🤖 AI ANALYSIS FEEDBACK'));
      console.log(chalk.blue('='.repeat(60) + '\n'));

      console.log(chalk.green.bold('Copywriting:'));
      console.log(chalk.white(copywriting.feedback));

      console.log(chalk.green.bold('\nVisual Identity:'));
      console.log(chalk.white(visualIdentity.feedback));

      console.log(chalk.green.bold('\nOriginality:'));
      console.log(chalk.white(originality.feedback));
    }

    // Content mix details
    console.log(chalk.blue('\n' + '-'.repeat(60)));
    console.log(chalk.bold('\n📸 Content Mix:\n'));
    console.log(`  Photos: ${Math.round(result.metrics.content_mix.photo)}%`);
    console.log(`  Videos: ${Math.round(result.metrics.content_mix.video)}%`);
    console.log(`  Carousels: ${Math.round(result.metrics.content_mix.carousel)}%`);

    console.log(chalk.blue('\n' + '='.repeat(60) + '\n'));

    if (!options.verbose) {
      console.log(chalk.gray('💡 Tip: Use --verbose flag for detailed AI feedback\n'));
    }
  });

program
  .command('website')
  .description('Analyze a food business website with comprehensive scoring')
  .argument('<url>', 'Website URL (with or without https://)')
  .option('-v, --verbose', 'Show detailed AI analysis and recommendations')
  .action(async (url, options) => {
    // Validate API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error(chalk.red('❌ Error: ANTHROPIC_API_KEY not found'));
      console.log(chalk.yellow('\nPlease create a .env file with your Anthropic API key:'));
      console.log(chalk.cyan('ANTHROPIC_API_KEY=your_key_here'));
      process.exit(1);
    }

    console.log(chalk.blue.bold(`\n🍽️  Analyzing Food Business Website: ${url}\n`));

    // Step 1: Scrape website
    const scrapeSpinner = ora('Fetching website data...').start();
    let websiteData;
    try {
      websiteData = await scrapeWebsite(url);
      scrapeSpinner.succeed(chalk.green('Website data fetched'));
    } catch (error) {
      scrapeSpinner.fail(chalk.red('Failed to fetch website'));
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }

    // Step 2: Automatic analyses (no AI cost)
    const autoSpinner = ora('Running automatic analyses...').start();
    const menuContent = analyzeMenuContent(websiteData.$);
    const seoAnalysis = analyzeSEO(websiteData);
    const cmsAnalysis = detectCMS(websiteData);
    const complianceAnalysis = analyzeCompliance(websiteData);
    const analyticsAnalysis = analyzeAnalytics(websiteData);
    autoSpinner.succeed(chalk.green('Automatic analyses completed'));

    // Step 3: AI analyses
    console.log(chalk.blue('\n🤖 Running AI analysis...\n'));

    const menuSpinner = ora('Analyzing menu quality...').start();
    const menuAnalysis = await analyzeMenuQuality(websiteData, menuContent, apiKey);
    menuSpinner.succeed(chalk.green('Menu analyzed'));

    const brandSpinner = ora('Analyzing brand identity...').start();
    const brandAnalysis = await analyzeBrandIdentity(websiteData, apiKey);
    brandSpinner.succeed(chalk.green('Brand analyzed'));

    const uxSpinner = ora('Analyzing UX & mobile...').start();
    const uxAnalysis = await analyzeUX(websiteData, apiKey);
    uxSpinner.succeed(chalk.green('UX analyzed'));

    // Step 4: Calculate final score
    const scoreSpinner = ora('Calculating final score...').start();
    const analyses = {
      menuAnalysis,
      brandAnalysis,
      uxAnalysis,
      seoAnalysis,
      cmsAnalysis,
      complianceAnalysis,
      analyticsAnalysis
    };
    const result = calculateWebsiteScore(analyses);
    const summary = generateWebsiteSummary(result, analyses);
    scoreSpinner.succeed(chalk.green('Score calculated'));

    // Display results
    console.log(chalk.blue('\n' + '='.repeat(80)));
    console.log(chalk.blue.bold('📊 WEBSITE ANALYSIS RESULTS'));
    console.log(chalk.blue('='.repeat(80) + '\n'));

    // Website info
    console.log(chalk.bold('URL:'), chalk.cyan(websiteData.url));
    console.log(chalk.bold('Title:'), websiteData.metadata.title);
    if (cmsAnalysis.cms !== 'Unknown') {
      console.log(chalk.bold('CMS:'), `${cmsAnalysis.cms}${cmsAnalysis.version ? ' v' + cmsAnalysis.version : ''}`);
    }

    // Final score
    let scoreColor = chalk.green;
    if (result.finalScore < 60) scoreColor = chalk.yellow;
    if (result.finalScore < 45) scoreColor = chalk.red;

    console.log(chalk.blue('\n' + '-'.repeat(80)));
    console.log(scoreColor.bold(`\n🎯 FINAL SCORE: ${result.finalScore}/100`));
    console.log(chalk.bold.cyan(`📌 Status: ${summary.status}`));
    if (summary.riskLevel && summary.riskLevel !== 'LOW') {
      const riskColor = summary.riskLevel === 'HIGH' ? chalk.red : chalk.yellow;
      console.log(riskColor.bold(`⚠️  Compliance Risk: ${summary.riskLevel}`));
    }
    console.log(chalk.blue('\n' + '-'.repeat(80) + '\n'));

    // Score breakdown
    console.log(chalk.bold('Score Breakdown:\n'));

    const labels = {
      menu_offerta: 'Menu/Offerta',
      brand_emozione: 'Brand/Emozione',
      ux_mobile: 'UX & Mobile',
      seo_local: 'SEO/Local',
      performance: 'Performance/Tecnica',
      cms: 'CMS',
      compliance: 'Compliance/Privacy',
      social_proof: 'Social Proof/Analytics'
    };

    for (const [key, data] of Object.entries(result.breakdown)) {
      const barLength = Math.round(data.score / 5);
      const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
      const rating = result.ratings[key];
      const ratingColor = data.score >= 75 ? chalk.green : (data.score >= 60 ? chalk.yellow : chalk.red);

      console.log(
        chalk.bold(labels[key].padEnd(25)),
        chalk.cyan(`${data.score}/100`),
        chalk.gray(`(${data.weight}%)`),
        ratingColor(`[${rating}]`)
      );
      console.log(`  ${bar}`);
    }

    // Executive Summary
    console.log(chalk.blue('\n' + '='.repeat(80)));
    console.log(chalk.bold.blue('📋 EXECUTIVE SUMMARY\n'));

    if (summary.strongAreas.length > 0) {
      console.log(chalk.bold.green('✓ Punti di Forza:'));
      summary.strongAreas.forEach(area => {
        console.log(chalk.green(`  • ${area}`));
      });
      console.log();
    }

    if (summary.weakAreas.length > 0) {
      console.log(chalk.bold.yellow('⚠ Aree da Migliorare:'));
      summary.weakAreas.forEach(area => {
        console.log(chalk.yellow(`  • ${area}`));
      });
      console.log();
    }

    console.log(chalk.bold.cyan('💡 Raccomandazioni Prioritarie:\n'));
    summary.recommendations.forEach((rec, i) => {
      console.log(chalk.cyan(`${i + 1}. ${rec}`));
    });

    console.log(chalk.blue('\n' + '-'.repeat(80)));

    // Verbose mode: detailed analysis
    if (options.verbose) {
      console.log(chalk.blue('\n' + '='.repeat(80)));
      console.log(chalk.blue.bold('🔍 DETAILED ANALYSIS'));
      console.log(chalk.blue('='.repeat(80) + '\n'));

      console.log(chalk.green.bold('Menu & Offerta:'));
      console.log(chalk.white(menuAnalysis.feedback));
      if (menuAnalysis.strongPoints.length > 0) {
        console.log(chalk.gray('  Punti forti: ' + menuAnalysis.strongPoints.join(', ')));
      }
      if (menuAnalysis.weaknesses.length > 0) {
        console.log(chalk.gray('  Da migliorare: ' + menuAnalysis.weaknesses.join(', ')));
      }

      console.log(chalk.green.bold('\nBrand & Identità:'));
      console.log(chalk.white(brandAnalysis.feedback));
      console.log(chalk.gray(`  Brand personality: ${brandAnalysis.brandPersonality}`));

      console.log(chalk.green.bold('\nUX & Mobile:'));
      console.log(chalk.white(uxAnalysis.feedback));

      console.log(chalk.green.bold('\nSEO & Local:'));
      if (seoAnalysis.issues.length > 0) {
        console.log(chalk.yellow('  Issues rilevati:'));
        seoAnalysis.issues.forEach(issue => {
          console.log(chalk.gray(`  - ${issue}`));
        });
      } else {
        console.log(chalk.white('  Ottimizzazione SEO completa ✓'));
      }

      console.log(chalk.green.bold('\nCompliance:'));
      if (complianceAnalysis.issues.length > 0) {
        complianceAnalysis.issues.forEach(issue => {
          const color = issue.includes('CRITICAL') ? chalk.red : chalk.yellow;
          console.log(color(`  - ${issue}`));
        });
      } else {
        console.log(chalk.white('  Nessun problema di compliance rilevato ✓'));
      }

      console.log(chalk.green.bold('\nCMS:'));
      console.log(chalk.white(`  ${cmsAnalysis.cms}${cmsAnalysis.version ? ' v' + cmsAnalysis.version : ''}`));
      if (cmsAnalysis.technologies.length > 0) {
        console.log(chalk.gray(`  Tecnologie: ${cmsAnalysis.technologies.join(', ')}`));
      }
      console.log(chalk.gray(`  ${cmsAnalysis.recommendation}`));
    }

    console.log(chalk.blue('\n' + '='.repeat(80) + '\n'));

    if (!options.verbose) {
      console.log(chalk.gray('💡 Tip: Use --verbose flag for detailed analysis and specific issues\n'));
    }
  });

program
  .command('reviews')
  .description('Analyze restaurant reputation from Google reviews')
  .argument('<business>', 'Restaurant name and location (e.g., "Ristorante Davide, Roma")')
  .option('--place-id <id>', 'Google Place ID for precise restaurant identification')
  .option('-v, --verbose', 'Show detailed sentiment analysis and themes')
  .option('--show-reviews', 'Show all reviews organized by timeframe (last month, 3 months, 6 months, year)')
  .action(async (business, options) => {
    // Validate API keys
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const googleKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!anthropicKey) {
      console.error(chalk.red('❌ Error: ANTHROPIC_API_KEY not found'));
      console.log(chalk.yellow('\nPlease add it to your .env file:'));
      console.log(chalk.cyan('ANTHROPIC_API_KEY=your_key_here'));
      process.exit(1);
    }

    if (!googleKey) {
      console.error(chalk.red('❌ Error: GOOGLE_PLACES_API_KEY not found'));
      console.log(chalk.yellow('\nPlease add it to your .env file:'));
      console.log(chalk.cyan('GOOGLE_PLACES_API_KEY=your_key_here'));
      console.log(chalk.gray('\nGet your key from: https://console.cloud.google.com/'));
      console.log(chalk.gray('Enable "Places API" and create an API key'));
      process.exit(1);
    }

    console.log(chalk.blue.bold(`\n🌟 Analyzing Restaurant Reputation: ${business}\n`));

    // Step 1: Fetch Google Reviews
    const googleSpinner = ora('Fetching Google reviews...').start();
    let googleData;
    try {
      googleData = await scrapeGoogleReviews(business, googleKey, options.placeId || null);
      googleSpinner.succeed(chalk.green(`Google: ${googleData.rating}⭐ (${googleData.totalReviews} reviews)`));

      // Display warning if multiple results found
      if (googleData.multipleResultsWarning) {
        console.log(chalk.yellow(`\n⚠️  Found ${googleData.multipleResultsWarning.count} restaurants with similar names.`));
        console.log(chalk.yellow(`   Analyzing: "${googleData.restaurantName}" at ${googleData.address}\n`));

        if (googleData.multipleResultsWarning.alternatives.length > 1) {
          console.log(chalk.gray('   Other results found:'));
          googleData.multipleResultsWarning.alternatives.slice(1).forEach((alt, i) => {
            console.log(chalk.gray(`   ${i + 2}. ${alt.name} - ${alt.address} (${alt.rating}⭐)`));
          });
          console.log(chalk.gray(`\n   💡 For precise analysis, use: --place-id ${googleData.placeId}\n`));
        }
      }
    } catch (error) {
      googleSpinner.fail(chalk.red('Failed to fetch Google reviews'));
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }

    // Step 2: Prepare reviews for analysis
    const allReviews = googleData.reviews.map(r => ({ ...r, platform: 'google' }));

    // Step 3: Trend Analysis
    const trendSpinner = ora('Analyzing temporal trends...').start();
    const trendAnalysis = analyzeTrend(allReviews, googleData.rating);
    trendSpinner.succeed(chalk.green('Trend analysis completed'));

    // Step 4: AI Sentiment Analysis
    console.log(chalk.blue('\n🤖 Running AI sentiment analysis...\n'));
    const sentimentSpinner = ora('Analyzing review sentiment...').start();
    const sentimentAnalysis = await analyzeSentiment(allReviews, {
      restaurantName: googleData.restaurantName,
      platforms: ['Google']
    }, anthropicKey);
    sentimentSpinner.succeed(chalk.green('Sentiment analysis completed'));

    // Step 5: Calculate Final Score
    const scoreSpinner = ora('Calculating reputation score...').start();
    const result = calculateReputationScore(googleData, null, trendAnalysis, sentimentAnalysis);
    const summary = generateRepSummary(result, trendAnalysis, sentimentAnalysis);
    scoreSpinner.succeed(chalk.green('Reputation score calculated'));

    // Step 6: Generate Executive Summary
    const summarySpinner = ora('Generating executive summary...').start();
    const execSummary = await generateReputationSummary(
      googleData,
      trendAnalysis,
      sentimentAnalysis,
      result,
      anthropicKey
    );
    summarySpinner.succeed(chalk.green('Executive summary generated'));

    // ========== DISPLAY RESULTS ==========
    console.log(chalk.blue('\n' + '='.repeat(80)));
    console.log(chalk.blue.bold('🌟 REPUTATION ANALYSIS RESULTS'));
    console.log(chalk.blue('='.repeat(80) + '\n'));

    // Restaurant info
    console.log(chalk.bold('Restaurant:'), chalk.cyan(googleData.restaurantName));
    if (googleData.address) {
      console.log(chalk.bold('Address:'), googleData.address);
    }

    // Final score
    let scoreColor = chalk.green;
    if (result.finalScore < 60) scoreColor = chalk.yellow;
    if (result.finalScore < 45) scoreColor = chalk.red;

    console.log(chalk.blue('\n' + '-'.repeat(80)));
    console.log(scoreColor.bold(`\n🎯 REPUTATION SCORE: ${result.finalScore}/100`));
    console.log(chalk.bold.cyan(`📌 Status: ${summary.status}`));
    if (summary.riskLevel && summary.riskLevel !== 'LOW') {
      const riskColor = summary.riskLevel === 'HIGH' ? chalk.red : chalk.yellow;
      console.log(riskColor.bold(`⚠️  Risk Level: ${summary.riskLevel}`));
    }
    console.log(chalk.blue('\n' + '-'.repeat(80) + '\n'));

    // Platform breakdown
    console.log(chalk.bold('Platform Ratings:\n'));

    const googleBar = '█'.repeat(Math.round(googleData.rating * 4)) + '░'.repeat(20 - Math.round(googleData.rating * 4));
    console.log(chalk.bold('Google Maps'.padEnd(25)), chalk.cyan(`${googleData.rating}⭐`), chalk.gray(`(${googleData.totalReviews} reviews)`));
    console.log(`  ${googleBar}`);


    // Score breakdown
    console.log(chalk.blue('\n' + '-'.repeat(80)));
    console.log(chalk.bold('\nScore Breakdown:\n'));

    const labels = {
      rating_quality: 'Rating Quality',
      review_volume: 'Review Volume',
      trend_direction: 'Trend Direction',
      recency: 'Recent Activity',
      owner_response: 'Owner Response Rate',
      sentiment_ai: 'Sentiment Positivity'
    };

    for (const [key, data] of Object.entries(result.breakdown)) {
      const barLength = Math.round(data.score / 5);
      const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
      const rating = result.ratings[key];
      const ratingColor = data.score >= 75 ? chalk.green : (data.score >= 60 ? chalk.yellow : chalk.red);

      console.log(
        chalk.bold(labels[key].padEnd(25)),
        chalk.cyan(`${data.score}/100`),
        chalk.gray(`(${data.weight}%)`),
        ratingColor(`[${rating}]`)
      );
      console.log(`  ${bar}`);
    }

    // Trend Analysis
    const trendDesc = generateTrendDescription(trendAnalysis);
    console.log(chalk.blue('\n' + '='.repeat(80)));
    console.log(chalk.bold.blue('📈 TREND ANALYSIS\n'));

    console.log(chalk.bold('Ultimo mese:    '),
      chalk.cyan(`⭐ ${trendAnalysis.timeframes.last_30_days.avg_rating || 'N/A'}`),
      chalk.gray(`(${trendAnalysis.timeframes.last_30_days.review_count} recensioni)`),
      trendDesc.emoji,
      chalk.gray(trendAnalysis.velocity.rating_change_30d > 0 ? `+${trendAnalysis.velocity.rating_change_30d}` : `${trendAnalysis.velocity.rating_change_30d}`)
    );

    console.log(chalk.bold('Ultimi 3 mesi: '),
      chalk.cyan(`⭐ ${trendAnalysis.timeframes.last_90_days.avg_rating || 'N/A'}`),
      chalk.gray(`(${trendAnalysis.timeframes.last_90_days.review_count} recensioni)`),
      chalk.gray(trendAnalysis.velocity.rating_change_90d > 0 ? `+${trendAnalysis.velocity.rating_change_90d}` : `${trendAnalysis.velocity.rating_change_90d}`)
    );

    console.log(chalk.bold('Ultimi 6 mesi: '),
      chalk.cyan(`⭐ ${trendAnalysis.timeframes.last_6_months.avg_rating || 'N/A'}`),
      chalk.gray(`(${trendAnalysis.timeframes.last_6_months.review_count} recensioni)`)
    );

    console.log(chalk.bold('Ultimo anno:   '),
      chalk.cyan(`⭐ ${trendAnalysis.timeframes.last_year.avg_rating || 'N/A'}`),
      chalk.gray(`(${trendAnalysis.timeframes.last_year.review_count} recensioni)`)
    );

    const directionColor = trendAnalysis.overall_direction === 'IMPROVING' ? chalk.green :
                          trendAnalysis.overall_direction === 'DECLINING' ? chalk.red : chalk.yellow;
    console.log(chalk.bold('\nDirezione:'), directionColor.bold(trendDesc.description));
    console.log(chalk.bold('Momentum: '), trendAnalysis.momentum > 0 ? chalk.green(`+${trendAnalysis.momentum}`) : chalk.red(`${trendAnalysis.momentum}`));
    console.log(chalk.bold('Frequenza:'), chalk.cyan(`${trendAnalysis.velocity.review_velocity} recensioni/mese`));

    // Show reviews if requested
    if (options.showReviews) {
      console.log(chalk.blue('\n' + '='.repeat(80)));
      console.log(chalk.bold.blue('📝 RECENSIONI RECENTI\n'));

      // Calculate average rating of recent reviews
      const recentReviewsAvg = allReviews.length > 0
        ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
        : 0;

      // Compare with overall rating
      const overallRating = googleData.rating;
      const trendDiff = (recentReviewsAvg - overallRating).toFixed(1);
      const trendIcon = trendDiff > 0 ? '↗️' : (trendDiff < 0 ? '↘️' : '→');
      const trendColor = trendDiff > 0 ? chalk.green : (trendDiff < 0 ? chalk.red : chalk.yellow);

      console.log(chalk.bold('Recensioni mostrate:'), chalk.cyan(`${allReviews.length} (le più recenti disponibili)`));
      console.log(chalk.bold('Media recensioni recenti:'), chalk.cyan(`${recentReviewsAvg}⭐`));
      console.log(chalk.bold('Rating complessivo:'), chalk.cyan(`${overallRating}⭐`));
      console.log(chalk.bold('Trend:'), trendColor(`${trendIcon} ${trendDiff > 0 ? '+' : ''}${trendDiff} rispetto al punteggio consolidato`));

      console.log(chalk.gray('\n' + '-'.repeat(80) + '\n'));

      allReviews.forEach((review, index) => {
        const ratingStars = '⭐'.repeat(review.rating);
        const platformBadge = review.platform === 'google' ? chalk.blue('[Google]') : chalk.green('[TripAdvisor]');

        console.log(chalk.bold(`${index + 1}. ${ratingStars} ${platformBadge}`));
        console.log(chalk.gray(`   📅 ${review.date} - ${review.author}`));

        if (review.text) {
          const textPreview = review.text.length > 150
            ? review.text.substring(0, 150) + '...'
            : review.text;
          console.log(chalk.white(`   "${textPreview}"`));
        }
        console.log();
      });

      console.log(chalk.gray('-'.repeat(80)));
    }

    // Executive Summary
    console.log(chalk.blue('\n' + '='.repeat(80)));
    console.log(chalk.bold.blue('📋 EXECUTIVE SUMMARY\n'));

    if (execSummary.key_insight) {
      console.log(chalk.bold('🔑 Key Insight:'));
      console.log(chalk.white(`   ${execSummary.key_insight}\n`));
    }

    if (execSummary.prognosis) {
      console.log(chalk.bold('🔮 Prognosi (6 mesi):'));
      console.log(chalk.white(`   ${execSummary.prognosis}\n`));
    }

    if (summary.strongAreas.length > 0) {
      console.log(chalk.bold.green('✓ Punti di Forza:'));
      summary.strongAreas.forEach(area => {
        console.log(chalk.green(`  • ${area}`));
      });
      console.log();
    }

    if (summary.weakAreas.length > 0) {
      console.log(chalk.bold.yellow('⚠ Aree da Migliorare:'));
      summary.weakAreas.forEach(area => {
        console.log(chalk.yellow(`  • ${area}`));
      });
      console.log();
    }

    console.log(chalk.bold.cyan('💡 Raccomandazioni Prioritarie:\n'));
    summary.recommendations.forEach((rec, i) => {
      console.log(chalk.cyan(`${i + 1}. ${rec}`));
    });

    // Verbose mode: Detailed sentiment analysis
    if (options.verbose) {
      console.log(chalk.blue('\n' + '='.repeat(80)));
      console.log(chalk.blue.bold('🔍 DETAILED SENTIMENT ANALYSIS'));
      console.log(chalk.blue('='.repeat(80) + '\n'));

      console.log(chalk.bold('Sentiment Score:'), chalk.cyan(`${sentimentAnalysis.sentiment_score}/100`));
      console.log(chalk.bold('Overall Tone:'), chalk.cyan(sentimentAnalysis.overall_tone));
      console.log(chalk.bold('Reviews Analyzed:'), chalk.cyan(sentimentAnalysis.reviews_analyzed));

      if (sentimentAnalysis.positive_themes?.length > 0) {
        console.log(chalk.green.bold('\n✓ Temi Positivi Ricorrenti:\n'));
        sentimentAnalysis.positive_themes.forEach(theme => {
          console.log(chalk.green(`  • ${theme.theme}`), chalk.gray(`(${theme.frequency} menzioni)`));
        });
      }

      if (sentimentAnalysis.critical_issues?.length > 0) {
        console.log(chalk.yellow.bold('\n⚠ Criticità Rilevate:\n'));
        sentimentAnalysis.critical_issues.forEach(issue => {
          const severityColor = issue.severity === 'HIGH' ? chalk.red :
                               issue.severity === 'MEDIUM' ? chalk.yellow : chalk.gray;
          console.log(severityColor(`  • ${issue.issue}`), chalk.gray(`(${issue.frequency} menzioni, severity: ${issue.severity})`));
        });
      }
    }

    console.log(chalk.blue('\n' + '='.repeat(80) + '\n'));

    if (!options.verbose) {
      console.log(chalk.gray('💡 Tip: Use --verbose flag for detailed sentiment themes and issues\n'));
    }
  });

program
  .command('gmb')
  .description('Analyze Google My Business profile completeness')
  .argument('<business>', 'Business name and location (e.g., "Ristorante Davide, Roma")')
  .option('--place-id <id>', 'Google Place ID for precise identification')
  .option('-v, --verbose', 'Show detailed breakdown for each metric')
  .action(async (business, options) => {
    // Validate API key
    const googleKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!googleKey) {
      console.error(chalk.red('❌ Error: GOOGLE_PLACES_API_KEY not found'));
      console.log(chalk.yellow('\nPlease add it to your .env file'));
      process.exit(1);
    }

    console.log(chalk.blue.bold(`\n📍 Analyzing Google My Business Profile\n`));
    console.log(chalk.bold('Business:'), chalk.cyan(business));

    // Fetch GMB data via Google Places API
    const googleSpinner = ora('Fetching Google My Business data...').start();
    let googleData;
    try {
      googleData = await scrapeGoogleReviews(business, googleKey, options.placeId || null);
      googleSpinner.succeed(chalk.green(`Found: ${googleData.restaurantName}`));
    } catch (error) {
      googleSpinner.fail(chalk.red('Failed to fetch GMB data'));
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }

    // Analyze GMB completeness
    const gmbSpinner = ora('Analyzing profile completeness...').start();
    const gmbAnalysis = analyzeGMBCompleteness(googleData);
    gmbSpinner.succeed(chalk.green('Analysis completed'));

    // Display results
    console.log(chalk.blue('\n' + '='.repeat(80)));
    console.log(chalk.blue.bold('📍 GOOGLE MY BUSINESS ANALYSIS'));
    console.log(chalk.blue('='.repeat(80) + '\n'));

    console.log(chalk.bold('Business:'), chalk.cyan(googleData.restaurantName));
    if (googleData.address) {
      console.log(chalk.bold('Address:'), googleData.address);
    }
    console.log(chalk.bold('Google Maps:'), chalk.cyan(`${googleData.rating}⭐ (${googleData.totalReviews} reviews)`));
    console.log(chalk.bold('Place ID:'), chalk.gray(googleData.placeId));

    // Final score
    let scoreColor = chalk.green;
    if (gmbAnalysis.finalScore < 70) scoreColor = chalk.yellow;
    if (gmbAnalysis.finalScore < 50) scoreColor = chalk.red;

    console.log(chalk.blue('\n' + '-'.repeat(80)));
    console.log(scoreColor.bold(`\n🎯 GMB COMPLETENESS SCORE: ${gmbAnalysis.finalScore}/100`));
    console.log(chalk.bold.cyan(`📌 Status: ${getGMBRatingLabel(gmbAnalysis.finalScore)}`));
    console.log(chalk.bold(`📊 Profile Completeness: ${gmbAnalysis.completenessPercentage}%`));
    console.log(chalk.blue('\n' + '-'.repeat(80) + '\n'));

    // Score breakdown
    console.log(chalk.bold('Completeness Breakdown:\n'));

    const labels = {
      basicInfo: 'Basic Information',
      photos: 'Photo Gallery',
      hours: 'Opening Hours',
      attributes: 'Business Attributes',
      engagement: 'Engagement & Activity'
    };

    for (const [metric, data] of Object.entries(gmbAnalysis.breakdown)) {
      const barLength = Math.round(data.score / 5);
      const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
      const scoreColor = data.score >= 80 ? chalk.green : (data.score >= 60 ? chalk.yellow : chalk.red);

      console.log(
        chalk.bold(labels[metric].padEnd(25)),
        scoreColor(`${data.score}/100`),
        chalk.gray(`(${data.weight}%)`)
      );
      console.log(`  ${bar}`);
    }

    // Quick stats
    console.log(chalk.blue('\n' + '-'.repeat(80)));
    console.log(chalk.bold('\n📊 Quick Stats:\n'));
    console.log(chalk.gray(`  Photos: ${googleData.photoCount}`));
    console.log(chalk.gray(`  Opening Hours: ${googleData.hasOpeningHours ? '✓ Present' : '✗ Missing'}`));
    console.log(chalk.gray(`  Website: ${googleData.website ? '✓ ' + googleData.website : '✗ Missing'}`));
    console.log(chalk.gray(`  Phone: ${googleData.phoneNumber || '✗ Missing'}`));
    console.log(chalk.gray(`  Menu: ${googleData.hasMenu ? '✓ Present' : '✗ Missing'}`));
    console.log(chalk.gray(`  Response Rate: ${googleData.responseRate}%`));

    // Recommendations
    if (gmbAnalysis.recommendations.length > 0) {
      console.log(chalk.blue('\n' + '='.repeat(80)));
      console.log(chalk.bold.blue('💡 RECOMMENDATIONS\n'));

      gmbAnalysis.recommendations.forEach((rec, i) => {
        const isUrgent = rec.includes('URGENTE') || rec.includes('IMPORTANTE');
        const color = isUrgent ? chalk.red : chalk.cyan;
        console.log(color(`${i + 1}. ${rec}`));
      });
    }

    // Verbose mode: detailed breakdown
    if (options.verbose) {
      console.log(chalk.blue('\n' + '='.repeat(80)));
      console.log(chalk.blue.bold('🔍 DETAILED BREAKDOWN'));
      console.log(chalk.blue('='.repeat(80) + '\n'));

      for (const [metric, data] of Object.entries(gmbAnalysis.breakdown)) {
        console.log(chalk.green.bold(`${labels[metric]}:`));
        console.log(chalk.white(`  Score: ${data.score}/100 (contributes ${data.contribution} points)`));

        if (data.details.checks) {
          console.log(chalk.gray('  Checks:'));
          for (const [check, passed] of Object.entries(data.details.checks)) {
            const icon = passed ? '✓' : '✗';
            const color = passed ? chalk.green : chalk.red;
            console.log(color(`    ${icon} ${check}`));
          }
        }

        if (data.details.recommendations && data.details.recommendations.length > 0) {
          console.log(chalk.gray('  Recommendations:'));
          data.details.recommendations.forEach(rec => {
            console.log(chalk.yellow(`    - ${rec}`));
          });
        }
        console.log();
      }
    }

    console.log(chalk.blue('\n' + '='.repeat(80) + '\n'));

    if (!options.verbose) {
      console.log(chalk.gray('💡 Tip: Use --verbose flag for detailed breakdown of each metric\n'));
    }
  });

program
  .command('global')
  .description('Comprehensive digital presence analysis across all channels')
  .argument('<business>', 'Business name and location (e.g., "Ristorante Davide, Roma")')
  .option('--instagram <username>', 'Instagram username to analyze')
  .option('--website <url>', 'Website URL to analyze')
  .option('--place-id <id>', 'Google Place ID for precise restaurant identification')
  .option('-v, --verbose', 'Show detailed analysis for each pillar')
  .action(async (business, options) => {
    // Validate API keys
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const googleKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!anthropicKey) {
      console.error(chalk.red('❌ Error: ANTHROPIC_API_KEY not found'));
      console.log(chalk.yellow('\nPlease add it to your .env file'));
      process.exit(1);
    }

    if (!googleKey) {
      console.error(chalk.red('❌ Error: GOOGLE_PLACES_API_KEY not found'));
      console.log(chalk.yellow('\nPlease add it to your .env file'));
      process.exit(1);
    }

    console.log(chalk.blue.bold(`\n🌟 DIGITAL PRESENCE ANALYSIS\n`));
    console.log(chalk.bold('Business:'), chalk.cyan(business));

    // Count what we're analyzing
    let analyzingCount = 1; // Always Google/Reputation
    if (options.instagram) analyzingCount++;
    if (options.website) analyzingCount++;
    console.log(chalk.gray(`Analyzing ${analyzingCount + 1}/4 channels (Reputation + GMB always included)\n`));

    const pillarResults = {};
    const pillarScores = {};

    // ========== PILLAR 1: REPUTATION (GOOGLE REVIEWS) ==========
    console.log(chalk.blue('📊 Analyzing Reputation...\n'));

    const googleSpinner = ora('Fetching Google reviews...').start();
    let googleData;
    try {
      googleData = await scrapeGoogleReviews(business, googleKey, options.placeId || null);
      googleSpinner.succeed(chalk.green(`Google: ${googleData.rating}⭐ (${googleData.totalReviews} reviews)`));
    } catch (error) {
      googleSpinner.fail(chalk.red('Failed to fetch Google reviews'));
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }

    // Trend analysis
    const trendSpinner = ora('Analyzing reputation trends...').start();
    const allReviews = googleData.reviews.map(r => ({ ...r, platform: 'google' }));
    const trendAnalysis = analyzeTrend(allReviews, googleData.rating);
    trendSpinner.succeed(chalk.green('Trend analysis completed'));

    // Sentiment analysis
    const sentimentSpinner = ora('Running AI sentiment analysis...').start();
    const sentimentAnalysis = await analyzeSentiment(allReviews, {
      restaurantName: googleData.restaurantName,
      platforms: ['Google']
    }, anthropicKey);
    sentimentSpinner.succeed(chalk.green('Sentiment analysis completed'));

    // Calculate reputation score
    const reputationResult = calculateReputationScore(googleData, null, trendAnalysis, sentimentAnalysis);
    pillarScores.reputation = reputationResult.finalScore;
    pillarResults.reputation = {
      score: reputationResult.finalScore,
      responseRate: googleData.responseRate,
      trendAnalysis,
      sentimentAnalysis,
      rating: googleData.rating,
      totalReviews: googleData.totalReviews,
      recommendations: generateRepSummary(reputationResult, trendAnalysis, sentimentAnalysis).recommendations
    };

    console.log(chalk.green(`✓ Reputation Score: ${reputationResult.finalScore}/100\n`));

    // ========== PILLAR 2: GOOGLE MY BUSINESS ==========
    console.log(chalk.blue('📍 Analyzing Google My Business...\n'));

    const gmbSpinner = ora('Analyzing GMB completeness...').start();
    const gmbAnalysis = analyzeGMBCompleteness(googleData);
    pillarScores.googleBusiness = gmbAnalysis.finalScore;
    pillarResults.googleBusiness = gmbAnalysis;
    gmbSpinner.succeed(chalk.green(`GMB Completeness: ${gmbAnalysis.finalScore}/100 (${gmbAnalysis.completenessPercentage}% complete)`));

    console.log(chalk.green(`✓ GMB Score: ${gmbAnalysis.finalScore}/100\n`));

    // ========== PILLAR 3: INSTAGRAM (OPTIONAL) ==========
    if (options.instagram) {
      console.log(chalk.blue('📱 Analyzing Instagram...\n'));

      const igSpinner = ora('Scraping Instagram profile...').start();
      let profileData;
      try {
        profileData = await scrapeProfile(options.instagram);
        igSpinner.succeed(chalk.green(`Instagram: @${profileData.username} (${profileData.followers.toLocaleString()} followers)`));
      } catch (error) {
        igSpinner.fail(chalk.red('Failed to scrape Instagram'));
        console.log(chalk.yellow(`⚠️  Skipping Instagram analysis: ${error.message}\n`));
        pillarScores.instagram = null;
      }

      if (profileData) {
        // Calculate metrics
        const basicMetrics = calculateBasicMetrics(profileData);
        basicMetrics.followers = profileData.followers;

        // AI Analysis
        const aiSpinner = ora('Running Instagram AI analysis...').start();
        const copywriting = await analyzeCopywriting(profileData.posts, anthropicKey);
        const visualIdentity = await analyzeVisualIdentity(profileData, anthropicKey);
        const originality = await analyzeOriginality(profileData, anthropicKey);
        aiSpinner.succeed(chalk.green('Instagram AI analysis completed'));

        // Calculate score
        const aiAnalysis = { copywriting, visualIdentity, originality };
        const igResult = calculateFinalScore(basicMetrics, aiAnalysis);
        const igSummary = await generateExecutiveSummary(igResult, profileData, aiAnalysis, anthropicKey);

        pillarScores.instagram = igResult.finalScore;
        pillarResults.instagram = {
          score: igResult.finalScore,
          username: profileData.username,
          followers: profileData.followers,
          engagementRate: igResult.metrics.engagement_rate,
          recommendations: igSummary.recommendations
        };

        console.log(chalk.green(`✓ Instagram Score: ${igResult.finalScore}/100\n`));
      }
    } else {
      console.log(chalk.gray('⊘ Instagram analysis skipped (use --instagram <username>)\n'));
      pillarScores.instagram = null;
    }

    // ========== PILLAR 4: WEBSITE (OPTIONAL) ==========
    if (options.website) {
      console.log(chalk.blue('🌐 Analyzing Website...\n'));

      const webSpinner = ora('Scraping website...').start();
      let websiteData;
      try {
        websiteData = await scrapeWebsite(options.website);
        webSpinner.succeed(chalk.green(`Website: ${websiteData.metadata.title}`));
      } catch (error) {
        webSpinner.fail(chalk.red('Failed to scrape website'));
        console.log(chalk.yellow(`⚠️  Skipping website analysis: ${error.message}\n`));
        pillarScores.website = null;
      }

      if (websiteData) {
        // Automatic analyses
        const menuContent = analyzeMenuContent(websiteData.$);
        const seoAnalysis = analyzeSEO(websiteData);
        const cmsAnalysis = detectCMS(websiteData);
        const complianceAnalysis = analyzeCompliance(websiteData);
        const analyticsAnalysis = analyzeAnalytics(websiteData);

        // AI analyses
        const webAiSpinner = ora('Running website AI analysis...').start();
        const menuAnalysis = await analyzeMenuQuality(websiteData, menuContent, anthropicKey);
        const brandAnalysis = await analyzeBrandIdentity(websiteData, anthropicKey);
        const uxAnalysis = await analyzeUX(websiteData, anthropicKey);
        webAiSpinner.succeed(chalk.green('Website AI analysis completed'));

        // Calculate score
        const analyses = {
          menuAnalysis,
          brandAnalysis,
          uxAnalysis,
          seoAnalysis,
          cmsAnalysis,
          complianceAnalysis,
          analyticsAnalysis
        };
        const webResult = calculateWebsiteScore(analyses);
        const webSummary = generateWebsiteSummary(webResult, analyses);

        pillarScores.website = webResult.finalScore;
        pillarResults.website = {
          score: webResult.finalScore,
          url: websiteData.url,
          cms: cmsAnalysis.cms,
          seoScore: seoAnalysis.score,
          recommendations: webSummary.recommendations
        };

        console.log(chalk.green(`✓ Website Score: ${webResult.finalScore}/100\n`));
      }
    } else {
      console.log(chalk.gray('⊘ Website analysis skipped (use --website <url>)\n'));
      pillarScores.website = null;
    }

    // ========== CALCULATE GLOBAL SCORE ==========
    const globalSpinner = ora('Calculating global digital presence score...').start();
    const globalResult = calculateGlobalScore(pillarScores);
    const globalSummary = generateGlobalSummary(globalResult, pillarResults);
    globalSpinner.succeed(chalk.green('Global score calculated'));

    // ========== DISPLAY GLOBAL RESULTS ==========
    console.log(chalk.blue('\n' + '='.repeat(80)));
    console.log(chalk.blue.bold('🎯 GLOBAL DIGITAL PRESENCE SCORE'));
    console.log(chalk.blue('='.repeat(80) + '\n'));

    console.log(chalk.bold('Restaurant:'), chalk.cyan(googleData.restaurantName));
    if (googleData.address) {
      console.log(chalk.bold('Address:'), googleData.address);
    }
    console.log(chalk.bold('Channels Analyzed:'), chalk.cyan(`${globalResult.availablePillars}/4`));
    console.log(chalk.bold('Data Completeness:'), chalk.cyan(`${Math.round(globalResult.completeness)}%`));

    // Final score
    let scoreColor = chalk.green;
    if (globalResult.finalScore < 60) scoreColor = chalk.yellow;
    if (globalResult.finalScore < 45) scoreColor = chalk.red;

    console.log(chalk.blue('\n' + '-'.repeat(80)));
    console.log(scoreColor.bold(`\n🎯 GLOBAL SCORE: ${globalResult.finalScore}/100`));
    console.log(chalk.bold.cyan(`📌 Status: ${globalSummary.status}`));
    if (globalSummary.riskLevel && globalSummary.riskLevel !== 'LOW') {
      const riskInfo = getRiskLevelLabel(globalSummary.riskLevel);
      const riskColor = riskInfo.color === 'red' ? chalk.red : chalk.yellow;
      console.log(riskColor.bold(`${riskInfo.emoji} Risk Level: ${riskInfo.text}`));
    }
    console.log(chalk.blue('\n' + '-'.repeat(80) + '\n'));

    // Pillar breakdown
    console.log(chalk.bold('Pillar Breakdown:\n'));

    const pillarLabels = {
      reputation: 'Reputation (Reviews)',
      google_business: 'Google My Business',
      instagram: 'Instagram Presence',
      website: 'Website Quality'
    };

    for (const [pillar, data] of Object.entries(globalResult.breakdown)) {
      if (data.available) {
        const emoji = getPillarEmoji(pillar);
        const barLength = Math.round(data.score / 5);
        const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
        const scoreColor = data.score >= 75 ? chalk.green : (data.score >= 60 ? chalk.yellow : chalk.red);
        const weightInfo = data.weight !== data.originalWeight
          ? chalk.gray(` (original: ${data.originalWeight}%, adjusted: ${data.weight}%)`)
          : chalk.gray(` (${data.weight}%)`);

        console.log(
          emoji,
          chalk.bold(pillarLabels[pillar].padEnd(25)),
          scoreColor(`${data.score}/100`),
          weightInfo
        );
        console.log(`  ${bar}`);

        // Show key detail for each pillar
        if (pillar === 'reputation' && pillarResults.reputation) {
          const trend = pillarResults.reputation.trendAnalysis.overall_direction;
          const trendIcon = trend === 'IMPROVING' ? '↗️' : (trend === 'DECLINING' ? '↘️' : '→');
          console.log(chalk.gray(`  → Google: ${pillarResults.reputation.rating}⭐ (${pillarResults.reputation.totalReviews} reviews) | Trend: ${trendIcon}`));
        }
        if (pillar === 'google_business' && pillarResults.googleBusiness) {
          console.log(chalk.gray(`  → Completeness: ${pillarResults.googleBusiness.completenessPercentage}% | Photos: ${googleData.photoCount} | Hours: ${googleData.hasOpeningHours ? '✓' : '✗'} | Menu: ${googleData.hasMenu ? '✓' : '✗'}`));
        }
        if (pillar === 'instagram' && pillarResults.instagram) {
          console.log(chalk.gray(`  → @${pillarResults.instagram.username} | ${pillarResults.instagram.followers.toLocaleString()} followers | ER: ${pillarResults.instagram.engagementRate}%`));
        }
        if (pillar === 'website' && pillarResults.website) {
          console.log(chalk.gray(`  → ${pillarResults.website.url} | CMS: ${pillarResults.website.cms} | SEO: ${pillarResults.website.seoScore}/100`));
        }
        console.log();
      } else {
        const emoji = getPillarEmoji(pillar);
        console.log(
          emoji,
          chalk.gray(pillarLabels[pillar].padEnd(25)),
          chalk.gray('Not analyzed'),
          chalk.gray(` (would add ${data.originalWeight}% weight)`)
        );
        console.log(chalk.gray(`  ░░░░░░░░░░░░░░░░░░░░`));
        console.log();
      }
    }

    // Executive Summary
    console.log(chalk.blue('='.repeat(80)));
    console.log(chalk.bold.blue('📋 EXECUTIVE SUMMARY\n'));

    if (globalSummary.keyInsight) {
      console.log(chalk.bold('🔑 Strategic Insight:'));
      console.log(chalk.white(`   ${globalSummary.keyInsight}\n`));
    }

    if (globalSummary.strongAreas.length > 0) {
      console.log(chalk.bold.green('✓ Strong Pillars:'));
      globalSummary.strongAreas.forEach(area => {
        console.log(chalk.green(`  • ${area}`));
      });
      console.log();
    }

    if (globalSummary.criticalAreas.length > 0) {
      console.log(chalk.bold.red('⚠️  Critical Areas:'));
      globalSummary.criticalAreas.forEach(area => {
        console.log(chalk.red(`  • ${area}`));
      });
      console.log();
    }

    console.log(chalk.bold.cyan('💡 Priority Actions:\n'));
    globalSummary.recommendations.forEach((rec, i) => {
      const isUrgent = rec.includes('[URGENTE]');
      const color = isUrgent ? chalk.red : chalk.cyan;
      console.log(color(`${i + 1}. ${rec}`));
    });

    console.log(chalk.blue('\n' + '='.repeat(80) + '\n'));

    if (!options.verbose) {
      console.log(chalk.gray('💡 Tip: Use --verbose flag for detailed analysis of each pillar\n'));
    }
  });

program.parse();
