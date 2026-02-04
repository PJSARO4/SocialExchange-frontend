-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'CAROUSEL', 'REELS');

-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('PENDING', 'QUEUED', 'PROCESSING', 'PUBLISHED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AutomationType" AS ENUM ('ENGAGEMENT', 'FOLLOW', 'DM', 'COMMENT');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('LIKE', 'COMMENT', 'FOLLOW', 'UNFOLLOW', 'DM', 'PUBLISH');

-- CreateEnum
CREATE TYPE "TargetType" AS ENUM ('POST', 'USER', 'STORY');

-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('PENDING', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'RATE_LIMITED');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('PUBLISH_POST', 'AUTO_LIKE', 'AUTO_COMMENT', 'AUTO_FOLLOW', 'AUTO_DM', 'FETCH_ANALYTICS');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'LOCKED', 'PROCESSING', 'COMPLETED', 'FAILED', 'DEAD_LETTER');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'TWITTER', 'YOUTUBE', 'LINKEDIN');

-- CreateEnum
CREATE TYPE "ControlMode" AS ENUM ('AUTOPILOT', 'ESCROW', 'MANUAL', 'OBSERVATION');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('IMAGE', 'VIDEO', 'CAROUSEL', 'STORY', 'REEL');

-- CreateEnum
CREATE TYPE "ContentSource" AS ENUM ('UPLOAD', 'CSV_IMPORT', 'CLOUD_SYNC', 'AI_GENERATED');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PENDING_REVIEW', 'POSTING', 'POSTED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "SocialFeed" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "platformAccountId" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "profilePictureUrl" TEXT,
    "accessToken" TEXT NOT NULL,
    "accessTokenExpires" TIMESTAMP(3),
    "refreshToken" TEXT,
    "isConnected" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncError" TEXT,
    "automationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "controlMode" "ControlMode" NOT NULL DEFAULT 'MANUAL',
    "followers" INTEGER NOT NULL DEFAULT 0,
    "following" INTEGER NOT NULL DEFAULT 0,
    "postsCount" INTEGER NOT NULL DEFAULT 0,
    "engagementRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgLikesPerPost" INTEGER NOT NULL DEFAULT 0,
    "avgCommentsPerPost" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialFeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedMetricsHistory" (
    "id" TEXT NOT NULL,
    "feedId" TEXT NOT NULL,
    "followers" INTEGER NOT NULL,
    "following" INTEGER NOT NULL,
    "postsCount" INTEGER NOT NULL,
    "engagementRate" DOUBLE PRECISION NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedMetricsHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Content" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ContentType" NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storageUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "duration" INTEGER,
    "tags" TEXT[],
    "source" "ContentSource" NOT NULL DEFAULT 'UPLOAD',
    "aiCaption" TEXT,
    "aiHashtags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledPost" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "feedId" TEXT NOT NULL,
    "contentId" TEXT,
    "caption" TEXT NOT NULL,
    "hashtags" TEXT[],
    "mediaUrls" TEXT[],
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "status" "PostStatus" NOT NULL DEFAULT 'SCHEDULED',
    "postedAt" TIMESTAMP(3),
    "platformPostId" TEXT,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_posts_new" (
    "id" TEXT NOT NULL,
    "feed_id" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "media_urls" TEXT[],
    "media_type" "MediaType" NOT NULL DEFAULT 'IMAGE',
    "scheduled_for" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "status" "ScheduleStatus" NOT NULL DEFAULT 'PENDING',
    "published_at" TIMESTAMP(3),
    "instagram_post_id" TEXT,
    "job_id" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_posts_new_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_rules" (
    "id" TEXT NOT NULL,
    "feed_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AutomationType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "run_interval" INTEGER,
    "last_run_at" TIMESTAMP(3),
    "next_run_at" TIMESTAMP(3),
    "actions_today" INTEGER NOT NULL DEFAULT 0,
    "actions_total" INTEGER NOT NULL DEFAULT 0,
    "stats_reset_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_actions" (
    "id" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "feed_id" TEXT NOT NULL,
    "action_type" "ActionType" NOT NULL,
    "target_type" "TargetType" NOT NULL,
    "target_id" TEXT,
    "target_username" TEXT,
    "content" TEXT,
    "status" "ActionStatus" NOT NULL DEFAULT 'PENDING',
    "executed_at" TIMESTAMP(3),
    "error_message" TEXT,
    "job_id" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automation_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limits" (
    "id" TEXT NOT NULL,
    "feed_id" TEXT NOT NULL,
    "action_type" "ActionType" NOT NULL,
    "daily_limit" INTEGER NOT NULL DEFAULT 100,
    "hourly_limit" INTEGER NOT NULL DEFAULT 30,
    "daily_count" INTEGER NOT NULL DEFAULT 0,
    "hourly_count" INTEGER NOT NULL DEFAULT 0,
    "daily_reset_at" TIMESTAMP(3) NOT NULL,
    "hourly_reset_at" TIMESTAMP(3) NOT NULL,
    "blocked_until" TIMESTAMP(3),
    "block_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_queue" (
    "id" TEXT NOT NULL,
    "queue_name" TEXT NOT NULL,
    "job_type" "JobType" NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "feed_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "scheduled_for" TIMESTAMP(3),
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "processed_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "last_error" TEXT,
    "worker_id" TEXT,
    "locked_at" TIMESTAMP(3),
    "lock_expiry" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_config" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "SocialFeed_userId_idx" ON "SocialFeed"("userId");

-- CreateIndex
CREATE INDEX "SocialFeed_platform_idx" ON "SocialFeed"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "SocialFeed_userId_platform_platformAccountId_key" ON "SocialFeed"("userId", "platform", "platformAccountId");

-- CreateIndex
CREATE INDEX "FeedMetricsHistory_feedId_recordedAt_idx" ON "FeedMetricsHistory"("feedId", "recordedAt");

-- CreateIndex
CREATE INDEX "Content_userId_idx" ON "Content"("userId");

-- CreateIndex
CREATE INDEX "Content_type_idx" ON "Content"("type");

-- CreateIndex
CREATE INDEX "ScheduledPost_userId_idx" ON "ScheduledPost"("userId");

-- CreateIndex
CREATE INDEX "ScheduledPost_feedId_idx" ON "ScheduledPost"("feedId");

-- CreateIndex
CREATE INDEX "ScheduledPost_scheduledFor_idx" ON "ScheduledPost"("scheduledFor");

-- CreateIndex
CREATE INDEX "ScheduledPost_status_idx" ON "ScheduledPost"("status");

-- CreateIndex
CREATE INDEX "scheduled_posts_new_feed_id_status_idx" ON "scheduled_posts_new"("feed_id", "status");

-- CreateIndex
CREATE INDEX "scheduled_posts_new_scheduled_for_status_idx" ON "scheduled_posts_new"("scheduled_for", "status");

-- CreateIndex
CREATE INDEX "scheduled_posts_new_job_id_idx" ON "scheduled_posts_new"("job_id");

-- CreateIndex
CREATE INDEX "automation_rules_feed_id_enabled_idx" ON "automation_rules"("feed_id", "enabled");

-- CreateIndex
CREATE INDEX "automation_rules_next_run_at_enabled_idx" ON "automation_rules"("next_run_at", "enabled");

-- CreateIndex
CREATE INDEX "automation_actions_rule_id_idx" ON "automation_actions"("rule_id");

-- CreateIndex
CREATE INDEX "automation_actions_feed_id_action_type_idx" ON "automation_actions"("feed_id", "action_type");

-- CreateIndex
CREATE INDEX "automation_actions_status_created_at_idx" ON "automation_actions"("status", "created_at");

-- CreateIndex
CREATE INDEX "automation_actions_job_id_idx" ON "automation_actions"("job_id");

-- CreateIndex
CREATE INDEX "rate_limits_feed_id_idx" ON "rate_limits"("feed_id");

-- CreateIndex
CREATE UNIQUE INDEX "rate_limits_feed_id_action_type_key" ON "rate_limits"("feed_id", "action_type");

-- CreateIndex
CREATE INDEX "job_queue_queue_name_status_scheduled_for_idx" ON "job_queue"("queue_name", "status", "scheduled_for");

-- CreateIndex
CREATE INDEX "job_queue_feed_id_idx" ON "job_queue"("feed_id");

-- CreateIndex
CREATE INDEX "job_queue_status_locked_at_idx" ON "job_queue"("status", "locked_at");

-- CreateIndex
CREATE UNIQUE INDEX "system_config_key_key" ON "system_config"("key");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialFeed" ADD CONSTRAINT "SocialFeed_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedMetricsHistory" ADD CONSTRAINT "FeedMetricsHistory_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "SocialFeed"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledPost" ADD CONSTRAINT "ScheduledPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledPost" ADD CONSTRAINT "ScheduledPost_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_posts_new" ADD CONSTRAINT "scheduled_posts_new_feed_id_fkey" FOREIGN KEY ("feed_id") REFERENCES "SocialFeed"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_feed_id_fkey" FOREIGN KEY ("feed_id") REFERENCES "SocialFeed"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_actions" ADD CONSTRAINT "automation_actions_feed_id_fkey" FOREIGN KEY ("feed_id") REFERENCES "SocialFeed"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_actions" ADD CONSTRAINT "automation_actions_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "automation_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_limits" ADD CONSTRAINT "rate_limits_feed_id_fkey" FOREIGN KEY ("feed_id") REFERENCES "SocialFeed"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_queue" ADD CONSTRAINT "job_queue_feed_id_fkey" FOREIGN KEY ("feed_id") REFERENCES "SocialFeed"("id") ON DELETE CASCADE ON UPDATE CASCADE;
